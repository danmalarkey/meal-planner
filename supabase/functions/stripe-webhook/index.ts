import Stripe from 'npm:stripe@22.1.1';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { requiredEnvironmentValue } from '../_shared/environment.ts';
import { createServiceSupabase } from '../_shared/service-supabase.ts';
import {
  assertMealPlannerStripeAccount,
  stripe,
  stripeCryptoProvider
} from '../_shared/stripe.ts';
import { stripeInvoiceSubscriptionId, syncStripeSubscription } from '../_shared/stripe-billing.ts';

const CHECKOUT_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'checkout.session.async_payment_failed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.expired'
]);

const SUBSCRIPTION_EVENTS = new Set<Stripe.Event.Type>([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed'
]);

const INVOICE_EVENTS = new Set<Stripe.Event.Type>([
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'invoice.finalization_failed'
]);

const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  ...CHECKOUT_EVENTS,
  ...SUBSCRIPTION_EVENTS,
  ...INVOICE_EVENTS
]);

function id(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

async function syncCheckoutSession(service: SupabaseClient, session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== 'subscription') {
    return;
  }

  const subscriptionId = id(session.subscription);
  if (!subscriptionId) {
    return;
  }

  const userId = session.client_reference_id ?? session.metadata?.['meal_planner_user_id'] ?? null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const syncedUserId = await syncStripeSubscription(service, subscription, userId);

  if (syncedUserId) {
    const { error } = await service
      .from('billing_checkout_attempts')
      .delete()
      .eq('user_id', syncedUserId);

    if (error) throw error;

  }
}

async function syncSubscriptionEvent(service: SupabaseClient, event: Stripe.Event): Promise<void> {
  const eventSubscription = event.data.object as Stripe.Subscription;
  let currentSubscription = eventSubscription;

  try {
    currentSubscription = await stripe.subscriptions.retrieve(eventSubscription.id);
  } catch (error) {
    if (event.type !== 'customer.subscription.deleted') {
      throw error;
    }
  }

  await syncStripeSubscription(service, currentSubscription);
}

async function syncInvoiceEvent(service: SupabaseClient, event: Stripe.Event): Promise<void> {
  const subscriptionId = stripeInvoiceSubscriptionId(event.data.object as Stripe.Invoice);
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(service, subscription);
}

async function clearCheckoutAttempt(service: SupabaseClient, session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.client_reference_id ?? session.metadata?.['meal_planner_user_id'] ?? null;

  if (!userId) return;

  const { error } = await service
    .from('billing_checkout_attempts')
    .delete()
    .eq('user_id', userId)
    .eq('stripe_checkout_session_id', session.id);

  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed.', { status: 405 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Stripe signature is required.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      requiredEnvironmentValue('MEAL_PLANNER_STRIPE_WEBHOOK_SECRET'),
      undefined,
      stripeCryptoProvider
    );
  } catch {
    return new Response('Invalid Stripe signature.', { status: 400 });
  }

  try {
    await assertMealPlannerStripeAccount();
    const service = createServiceSupabase();
    const { data: processed, error: processedError } = await service
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle<{ event_id: string }>();

    if (processedError) {
      throw processedError;
    }

    if (processed) {
      return Response.json({ received: true, duplicate: true });
    }

    if (HANDLED_EVENTS.has(event.type)) {
      if (
        event.type === 'checkout.session.expired' ||
        event.type === 'checkout.session.async_payment_failed'
      ) {
        await clearCheckoutAttempt(service, event.data.object as Stripe.Checkout.Session);
      } else if (
        event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded'
      ) {
        await syncCheckoutSession(service, event.data.object as Stripe.Checkout.Session);
      } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
        await syncSubscriptionEvent(service, event);
      } else if (INVOICE_EVENTS.has(event.type)) {
        await syncInvoiceEvent(service, event);
      }
    }

    const { error: logError } = await service.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      stripe_created_at: new Date(event.created * 1000).toISOString()
    });

    if (logError?.code !== '23505') {
      if (logError) throw logError;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
});
