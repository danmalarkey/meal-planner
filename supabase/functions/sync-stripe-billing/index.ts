import type Stripe from 'npm:stripe@22.1.1';
import { createAuthenticatedSupabase } from '../_shared/authenticated-supabase.ts';
import { allowedRequestOrigin, handleCors } from '../_shared/cors.ts';
import { createServiceSupabase } from '../_shared/service-supabase.ts';
import { errorResponse, HttpError, jsonResponse } from '../_shared/http.ts';
import { assertMealPlannerStripeAccount, stripe } from '../_shared/stripe.ts';
import {
  clearStripeSubscriptionProjection,
  isManageableSubscription,
  syncStripeSubscription
} from '../_shared/stripe-billing.ts';

interface BillingAccountRow {
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
}

function isMissingStripeResource(error: unknown): boolean {
  return (error as { statusCode?: unknown } | null)?.statusCode === 404;
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    if (request.method !== 'POST') {
      throw new HttpError(405, 'Method not allowed.');
    }

    if (!allowedRequestOrigin(request)) {
      throw new HttpError(400, 'The app origin is not allowed.');
    }

    await assertMealPlannerStripeAccount();
    const { user } = await createAuthenticatedSupabase(request);
    const service = createServiceSupabase();
    const { data: account, error: accountError } = await service
      .from('billing_accounts')
      .select('stripe_customer_id,stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle<BillingAccountRow>();

    if (accountError) throw accountError;
    if (!account) return jsonResponse(request, { synced: true });

    let subscription: Stripe.Subscription | null = null;

    if (account.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
      } catch (error) {
        if (!isMissingStripeResource(error)) throw error;
      }
    }

    if (!subscription) {
      const subscriptions = await stripe.subscriptions.list({
        customer: account.stripe_customer_id,
        status: 'all',
        limit: 10
      });
      subscription = subscriptions.data.find(isManageableSubscription) ?? null;
    }

    if (subscription) {
      await syncStripeSubscription(service, subscription, user.id);
    } else {
      await clearStripeSubscriptionProjection(service, user.id);
    }

    return jsonResponse(request, { synced: true });
  } catch (error) {
    return errorResponse(request, error, 'Billing details could not be refreshed.');
  }
});
