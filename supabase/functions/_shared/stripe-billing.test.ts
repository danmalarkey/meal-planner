import type Stripe from 'npm:stripe@22.1.1';
import {
  isManageableSubscription,
  stripeInvoiceSubscriptionId,
  stripeSubscriptionProjection
} from './stripe-billing.ts';

function subscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_test',
    customer: 'cus_test',
    status: 'active',
    cancel_at: null,
    cancel_at_period_end: false,
    items: {
      data: [
        {
          current_period_start: 1_786_498_765,
          current_period_end: 1_789_177_165,
          price: {
            id: 'price_test',
            product: 'prod_test',
            currency: 'usd',
            unit_amount: 499,
            recurring: { interval: 'month' }
          }
        } as Stripe.SubscriptionItem
      ]
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    metadata: {},
    ...overrides
  } as Stripe.Subscription;
}

Deno.test('maps flexible billing cancel_at into a scheduled cancellation', () => {
  const projection = stripeSubscriptionProjection(subscription({ cancel_at: 1_789_177_165 }));

  if (!projection?.cancel_at_period_end) {
    throw new Error('Expected cancel_at to mark the subscription as canceling.');
  }

  if (projection.scheduled_cancel_at !== '2026-09-12T01:39:25.000Z') {
    throw new Error(`Unexpected scheduled cancellation: ${projection.scheduled_cancel_at}`);
  }
});

Deno.test('keeps classic end-of-period cancellation compatible', () => {
  const projection = stripeSubscriptionProjection(subscription({ cancel_at_period_end: true }));

  if (!projection?.cancel_at_period_end || projection.scheduled_cancel_at !== null) {
    throw new Error('Expected classic cancellation to use the current period fallback.');
  }
});

Deno.test('separates manageable and terminal subscription states', () => {
  if (!isManageableSubscription({ status: 'past_due' } as Stripe.Subscription)) {
    throw new Error('Past-due subscriptions must remain manageable.');
  }

  if (isManageableSubscription({ status: 'canceled' } as Stripe.Subscription)) {
    throw new Error('Canceled subscriptions must not block a new checkout.');
  }
});

Deno.test('reads the subscription from current Stripe invoice parent details', () => {
  const invoice = {
    parent: { subscription_details: { subscription: 'sub_current' } }
  } as Stripe.Invoice;

  if (stripeInvoiceSubscriptionId(invoice) !== 'sub_current') {
    throw new Error('Expected the current invoice subscription relationship.');
  }
});

Deno.test('keeps legacy invoice subscription compatibility', () => {
  const invoice = { subscription: 'sub_legacy' } as unknown as Stripe.Invoice;

  if (stripeInvoiceSubscriptionId(invoice) !== 'sub_legacy') {
    throw new Error('Expected the legacy invoice subscription relationship.');
  }
});
