import Stripe from 'npm:stripe@22.1.1';
import { requiredEnvironmentValue } from './environment.ts';

export { type BillingInterval, stripePriceId } from './stripe-catalog.ts';

const stripeSecretKey = requiredEnvironmentValue('MEAL_PLANNER_STRIPE_SECRET_KEY');

if (
  stripeSecretKey.startsWith('sk_live_') &&
  Deno.env.get('MEAL_PLANNER_STRIPE_ALLOW_LIVE')?.trim().toLowerCase() !== 'true'
) {
  throw new Error('Live Stripe access is disabled for Meal Planner.');
}

export const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient()
});

export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();

let stripeAccountAssertion: Promise<void> | null = null;

export function assertMealPlannerStripeAccount(): Promise<void> {
  stripeAccountAssertion ??= (async () => {
    const expectedAccountId = requiredEnvironmentValue('MEAL_PLANNER_STRIPE_ACCOUNT_ID');
    const account = await stripe.accounts.retrieve();

    if (account.id !== expectedAccountId) {
      throw new Error('The configured Stripe key does not belong to the Meal Planner Stripe account.');
    }
  })();

  return stripeAccountAssertion;
}
