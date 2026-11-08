import { requiredEnvironmentValue } from './environment.ts';

export type BillingInterval = 'month' | 'year';

export function stripePriceId(interval: BillingInterval): string {
  return requiredEnvironmentValue(
    interval === 'month'
      ? 'MEAL_PLANNER_STRIPE_MONTHLY_PRICE_ID'
      : 'MEAL_PLANNER_STRIPE_ANNUAL_PRICE_ID'
  );
}

export function isConfiguredPriceId(priceId: string): boolean {
  return priceId === stripePriceId('month') || priceId === stripePriceId('year');
}
