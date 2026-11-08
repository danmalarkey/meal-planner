import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';

export type BillingInterval = 'month' | 'year';
export type BillingAction = BillingInterval | 'portal' | 'sync' | 'expire' | null;

export interface BillingAccount {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  subscriptionStatus: string | null;
  billingInterval: string | null;
  unitAmount: number | null;
  currency: string | null;
  cancelAtPeriodEnd: boolean;
  scheduledCancelAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  lastSyncedAt: string | null;
}

export interface BillingInvoice extends Record<string, unknown> {
  id: string;
  number: string | null;
  createdAt: string;
  status: string;
  total: number;
  currency: string;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

interface BillingAccountRow {
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_subscription_status: string | null;
  billing_interval: string | null;
  price_unit_amount: number | null;
  price_currency: string | null;
  cancel_at_period_end: boolean;
  scheduled_cancel_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  last_synced_at: string | null;
}

interface RedirectResponse {
  url?: unknown;
}

interface InvoiceHistoryResponse {
  invoices?: unknown;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly client = inject<SupabaseClient | null>(SUPABASE_CLIENT, { optional: true });
  private readonly accountState = signal<BillingAccount | null>(null);
  private readonly loadingState = signal(false);
  private readonly actionState = signal<BillingAction>(null);
  private readonly errorState = signal<string | null>(null);
  private readonly invoiceState = signal<BillingInvoice[]>([]);
  private readonly invoicesLoadingState = signal(false);
  private readonly invoiceErrorState = signal<string | null>(null);

  readonly account = this.accountState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly action = this.actionState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly invoices = this.invoiceState.asReadonly();
  readonly invoicesLoading = this.invoicesLoadingState.asReadonly();
  readonly invoiceError = this.invoiceErrorState.asReadonly();
  readonly hasSubscription = computed(() => {
    const account = this.accountState();
    return !!account?.stripeSubscriptionId && !['canceled', 'incomplete_expired'].includes(account.subscriptionStatus ?? '');
  });
  readonly hasPaidAccess = computed(() => {
    const status = this.accountState()?.subscriptionStatus;
    return status === 'active' || status === 'trialing';
  });

  async load(): Promise<void> {
    if (!this.client) {
      this.accountState.set(null);
      this.errorState.set('Billing requires a configured account.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const { data, error } = await this.client
        .from('billing_accounts')
        .select(
          'stripe_customer_id,stripe_subscription_id,stripe_price_id,stripe_subscription_status,billing_interval,price_unit_amount,price_currency,cancel_at_period_end,scheduled_cancel_at,current_period_start,current_period_end,last_synced_at'
        )
        .maybeSingle<BillingAccountRow>();

      if (error) {
        throw error;
      }

      this.accountState.set(data ? this.mapAccount(data) : null);
    } catch (error) {
      this.errorState.set(await this.errorMessage(error, 'Billing details could not be loaded.'));
    } finally {
      this.loadingState.set(false);
    }
  }

  async startCheckout(interval: BillingInterval): Promise<string | null> {
    return this.requestRedirect('create-stripe-checkout', interval, { interval });
  }

  async loadInvoices(): Promise<void> {
    if (!this.client) {
      this.invoiceState.set([]);
      this.invoiceErrorState.set('Billing requires a configured account.');
      return;
    }

    this.invoicesLoadingState.set(true);
    this.invoiceErrorState.set(null);

    try {
      const { data, error } = await this.client.functions.invoke<InvoiceHistoryResponse>(
        'list-stripe-invoices',
        { body: {} }
      );

      if (error) throw error;

      const invoices = Array.isArray(data?.invoices)
        ? data.invoices.flatMap((invoice) => this.mapInvoice(invoice))
        : [];
      this.invoiceState.set(invoices);
    } catch (error) {
      this.invoiceState.set([]);
      this.invoiceErrorState.set(await this.errorMessage(error, 'Billing history could not be loaded.'));
    } finally {
      this.invoicesLoadingState.set(false);
    }
  }

  async openPortal(): Promise<string | null> {
    return this.requestRedirect('create-stripe-portal', 'portal');
  }

  async refresh(): Promise<boolean> {
    return this.requestAction('sync-stripe-billing', 'sync');
  }

  async expireCheckout(): Promise<boolean> {
    return this.requestAction('expire-stripe-checkout', 'expire');
  }

  private async requestRedirect(
    functionName: 'create-stripe-checkout' | 'create-stripe-portal',
    action: Exclude<BillingAction, null>,
    body: Record<string, unknown> = {}
  ): Promise<string | null> {
    if (!this.client) {
      this.errorState.set('Billing requires a configured account.');
      return null;
    }

    this.actionState.set(action);
    this.errorState.set(null);

    try {
      const { data, error } = await this.client.functions.invoke<RedirectResponse>(functionName, { body });

      if (error) {
        throw error;
      }

      const url = typeof data?.url === 'string' ? data.url : '';
      if (!url || new URL(url).protocol !== 'https:') {
        throw new Error('The billing destination is invalid.');
      }

      return url;
    } catch (error) {
      this.errorState.set(await this.errorMessage(error, 'The billing request could not be completed.'));
      return null;
    } finally {
      this.actionState.set(null);
    }
  }

  private async requestAction(
    functionName: 'sync-stripe-billing' | 'expire-stripe-checkout',
    action: 'sync' | 'expire'
  ): Promise<boolean> {
    if (!this.client) {
      this.errorState.set('Billing requires a configured account.');
      return false;
    }

    this.actionState.set(action);
    this.errorState.set(null);

    try {
      const { error } = await this.client.functions.invoke(functionName, { body: {} });
      if (error) throw error;
      return true;
    } catch (error) {
      this.errorState.set(await this.errorMessage(error, 'Billing details could not be refreshed.'));
      return false;
    } finally {
      this.actionState.set(null);
    }
  }

  private mapAccount(row: BillingAccountRow): BillingAccount {
    return {
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      stripePriceId: row.stripe_price_id,
      subscriptionStatus: row.stripe_subscription_status,
      billingInterval: row.billing_interval,
      unitAmount: row.price_unit_amount,
      currency: row.price_currency,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      scheduledCancelAt: row.scheduled_cancel_at,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      lastSyncedAt: row.last_synced_at
    };
  }

  private mapInvoice(value: unknown): BillingInvoice[] {
    const invoice = value as Partial<BillingInvoice> | null;
    if (
      !invoice ||
      typeof invoice.id !== 'string' ||
      typeof invoice.createdAt !== 'string' ||
      typeof invoice.status !== 'string' ||
      typeof invoice.total !== 'number' ||
      typeof invoice.currency !== 'string'
    ) {
      return [];
    }

    return [{
      id: invoice.id,
      number: typeof invoice.number === 'string' ? invoice.number : null,
      createdAt: invoice.createdAt,
      status: invoice.status,
      total: invoice.total,
      currency: invoice.currency,
      invoicePdf: this.safeBillingUrl(invoice.invoicePdf),
      hostedInvoiceUrl: this.safeBillingUrl(invoice.hostedInvoiceUrl)
    }];
  }

  private safeBillingUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    try {
      return new URL(value).protocol === 'https:' ? value : null;
    } catch {
      return null;
    }
  }

  private async errorMessage(error: unknown, fallback: string): Promise<string> {
    const context = (error as { context?: unknown } | null)?.context;

    if (context instanceof Response) {
      try {
        const payload = await context.clone().json() as { error?: unknown };
        if (typeof payload.error === 'string' && payload.error.trim()) {
          return payload.error;
        }
      } catch {
        return fallback;
      }
    }

    const message = error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown } | null)?.message === 'string'
        ? (error as { message: string }).message
        : '';
    const normalizedMessage = message.toLocaleLowerCase();

    if (
      normalizedMessage.includes('billing_accounts') ||
      normalizedMessage.includes('scheduled_cancel_at') ||
      normalizedMessage.includes('last_synced_at') ||
      normalizedMessage.includes('schema cache')
    ) {
      return 'Billing setup is still being applied. Try again in a moment.';
    }

    if (normalizedMessage.includes('permission denied') || normalizedMessage.includes('row-level security')) {
      return 'Your billing details could not be accessed. Sign in again and retry.';
    }

    return fallback;
  }
}
