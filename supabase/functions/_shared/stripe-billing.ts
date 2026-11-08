import Stripe from 'npm:stripe@22.1.1';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { isConfiguredPriceId } from './stripe-catalog.ts';

const TERMINAL_SUBSCRIPTION_STATUSES = new Set(['canceled', 'incomplete_expired']);

function stripeId(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

function stripeTimestamp(value: number | null | undefined): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

export function stripeInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const versionedInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: {
      subscription_details?: {
        subscription?: string | Stripe.Subscription | null;
      } | null;
    } | null;
  };

  return stripeId(
    versionedInvoice.parent?.subscription_details?.subscription ??
    versionedInvoice.subscription ??
    null
  );
}

export interface StripeSubscriptionProjection {
  stripe_subscription_id: string;
  stripe_product_id: string | null;
  stripe_price_id: string;
  stripe_subscription_status: string;
  billing_interval: string | null;
  price_unit_amount: number | null;
  price_currency: string;
  cancel_at_period_end: boolean;
  scheduled_cancel_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  last_synced_at: string;
}

export function isManageableSubscription(subscription: Pick<Stripe.Subscription, 'status'>): boolean {
  return !TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status);
}

export function stripeSubscriptionProjection(
  subscription: Stripe.Subscription
): StripeSubscriptionProjection | null {
  const item = subscription.items.data[0];
  if (!item) return null;

  return {
    stripe_subscription_id: subscription.id,
    stripe_product_id: stripeId(item.price.product),
    stripe_price_id: item.price.id,
    stripe_subscription_status: subscription.status,
    billing_interval: item.price.recurring?.interval ?? null,
    price_unit_amount: item.price.unit_amount,
    price_currency: item.price.currency,
    cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at !== null,
    scheduled_cancel_at: stripeTimestamp(subscription.cancel_at),
    current_period_start: stripeTimestamp(item.current_period_start),
    current_period_end: stripeTimestamp(item.current_period_end),
    last_synced_at: new Date().toISOString()
  };
}

export async function syncStripeSubscription(
  service: SupabaseClient,
  subscription: Stripe.Subscription,
  explicitUserId: string | null = null
): Promise<string | null> {
  const customerId = stripeId(subscription.customer);
  const projection = stripeSubscriptionProjection(subscription);

  if (!customerId || !projection) {
    return null;
  }

  if (!isConfiguredPriceId(projection.stripe_price_id)) {
    throw new Error('Stripe subscription price is not configured for this app.');
  }

  if (
    subscription.items.has_more ||
    subscription.items.data.length !== 1 ||
    subscription.items.data[0]?.quantity !== 1
  ) {
    throw new Error('Subscriptions must contain exactly one plan with a quantity of one.');
  }

  const { data: existingAccount, error: existingAccountError } = await service
    .from('billing_accounts')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle<{ user_id: string }>();

  if (existingAccountError) {
    throw existingAccountError;
  }

  if (existingAccount && explicitUserId && existingAccount.user_id !== explicitUserId) {
    throw new Error('Stripe customer ownership does not match the app account.');
  }

  const userId =
    existingAccount?.user_id ??
    explicitUserId ??
    subscription.metadata['meal_planner_user_id']?.trim() ??
    null;

  if (!userId) {
    return null;
  }

  const { error } = await service.from('billing_accounts').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      ...projection
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw error;
  }

  return userId;
}

export async function clearStripeSubscriptionProjection(
  service: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await service
    .from('billing_accounts')
    .update({
      stripe_subscription_id: null,
      stripe_product_id: null,
      stripe_price_id: null,
      stripe_subscription_status: null,
      billing_interval: null,
      price_unit_amount: null,
      price_currency: null,
      cancel_at_period_end: false,
      scheduled_cancel_at: null,
      current_period_start: null,
      current_period_end: null,
      last_synced_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}
