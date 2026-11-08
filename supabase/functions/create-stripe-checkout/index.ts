import type Stripe from 'npm:stripe@22.1.1';
import { createAuthenticatedSupabase } from '../_shared/authenticated-supabase.ts';
import { allowedRequestOrigin, handleCors } from '../_shared/cors.ts';
import { createServiceSupabase } from '../_shared/service-supabase.ts';
import { errorResponse, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import {
  assertMealPlannerStripeAccount,
  BillingInterval,
  stripe,
  stripePriceId
} from '../_shared/stripe.ts';
import { isManageableSubscription, syncStripeSubscription } from '../_shared/stripe-billing.ts';

interface CheckoutRequest {
  interval?: unknown;
}

interface BillingAccountRow {
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
}

interface CheckoutClaim {
  claimed: boolean;
  attempt_token: string;
  billing_interval: BillingInterval;
  stripe_checkout_session_id: string | null;
  expires_at: string;
}

function billingInterval(value: unknown): BillingInterval {
  if (value === 'month' || value === 'year') {
    return value;
  }

  throw new HttpError(400, 'Choose a monthly or annual subscription.');
}

function hasManageableSubscription(account: BillingAccountRow | null): boolean {
  if (!account?.stripe_subscription_id) {
    return false;
  }

  return !['canceled', 'incomplete_expired'].includes(account.stripe_subscription_status ?? '');
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'POST') {
      throw new HttpError(405, 'Method not allowed.');
    }

    const origin = allowedRequestOrigin(request);
    if (!origin) {
      throw new HttpError(400, 'The app origin is not allowed.');
    }

    await assertMealPlannerStripeAccount();
    const body = await readJson<CheckoutRequest>(request);
    const interval = billingInterval(body.interval);
    const { user } = await createAuthenticatedSupabase(request);
    const service = createServiceSupabase();
    const { data: account, error: accountError } = await service
      .from('billing_accounts')
      .select('stripe_customer_id,stripe_subscription_id,stripe_subscription_status')
      .eq('user_id', user.id)
      .maybeSingle<BillingAccountRow>();

    if (accountError) {
      throw accountError;
    }

    if (hasManageableSubscription(account)) {
      throw new HttpError(409, 'A subscription already exists. Manage it from Billing settings.');
    }

    let customerId = account?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: { meal_planner_user_id: user.id }
        },
        { idempotencyKey: `meal-planner-customer-${user.id}` }
      );
      customerId = customer.id;

      const { error } = await service.from('billing_accounts').upsert(
        { user_id: user.id, stripe_customer_id: customerId },
        { onConflict: 'user_id' }
      );

      if (error) {
        throw error;
      }
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
      });
      const existingSubscription = subscriptions.data.find(isManageableSubscription);

      if (existingSubscription) {
        await syncStripeSubscription(service, existingSubscription, user.id);
        throw new HttpError(409, 'A subscription already exists. Manage it from Billing settings.');
      }
    }

    const attemptToken = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
    const { data: claim, error: claimError } = await service
      .rpc('claim_billing_checkout', {
        p_user_id: user.id,
        p_attempt_token: attemptToken,
        p_billing_interval: interval,
        p_expires_at: new Date(expiresAt * 1000).toISOString()
      })
      .single<CheckoutClaim>();

    if (claimError || !claim) {
      throw claimError ?? new Error('Checkout could not be reserved.');
    }

    if (!claim.claimed) {
      if (claim.billing_interval !== interval) {
        const cadence = claim.billing_interval === 'year' ? 'annual' : 'monthly';
        throw new HttpError(409, `A ${cadence} checkout is already open.`);
      }

      if (claim.stripe_checkout_session_id) {
        const existingSession = await stripe.checkout.sessions.retrieve(claim.stripe_checkout_session_id);

        if (existingSession.status === 'open' && existingSession.url) {
          return jsonResponse(request, { url: existingSession.url });
        }
      }

      throw new HttpError(409, 'Checkout is already being prepared. Try again in a moment.');
    }

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          customer: customerId,
          payment_method_types: ['card'],
          client_reference_id: user.id,
          line_items: [{ price: stripePriceId(interval), quantity: 1 }],
          metadata: {
            meal_planner_user_id: user.id,
            meal_planner_billing_interval: interval
          },
          subscription_data: {
            metadata: { meal_planner_user_id: user.id }
          },
          expires_at: expiresAt,
          success_url: `${origin}/?checkout=success`,
          cancel_url: `${origin}/?checkout=canceled`
        },
        { idempotencyKey: `meal-planner-checkout-${attemptToken}` }
      );

      const { error: attemptError } = await service
        .from('billing_checkout_attempts')
        .update({ stripe_checkout_session_id: session.id })
        .eq('user_id', user.id)
        .eq('attempt_token', attemptToken);

      if (attemptError) {
        await stripe.checkout.sessions.expire(session.id);
        throw attemptError;
      }
    } catch (error) {
      await service
        .from('billing_checkout_attempts')
        .delete()
        .eq('user_id', user.id)
        .eq('attempt_token', attemptToken);
      throw error;
    }

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.');
    }

    return jsonResponse(request, { url: session.url });
  } catch (error) {
    return errorResponse(request, error, 'Checkout could not be started.');
  }
});
