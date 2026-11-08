import { TestBed } from '@angular/core/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;
  let maybeSingle: jasmine.Spy;
  let invoke: jasmine.Spy;

  beforeEach(() => {
    maybeSingle = jasmine.createSpy('maybeSingle').and.resolveTo({ data: null, error: null });
    invoke = jasmine.createSpy('invoke').and.resolveTo({ data: null, error: null });
    const client = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({ maybeSingle })
      }),
      functions: { invoke }
    } as unknown as SupabaseClient;

    TestBed.configureTestingModule({
      providers: [
        BillingService,
        { provide: SUPABASE_CLIENT, useValue: client }
      ]
    });

    service = TestBed.inject(BillingService);
  });

  it('maps the authenticated user billing row into app state', async () => {
    maybeSingle.and.resolveTo({
      data: {
        stripe_customer_id: 'cus_test',
        stripe_subscription_id: 'sub_test',
        stripe_price_id: 'price_test',
        stripe_subscription_status: 'active',
        billing_interval: 'month',
        price_unit_amount: 499,
        price_currency: 'usd',
        cancel_at_period_end: false,
        scheduled_cancel_at: null,
        current_period_start: '2026-08-11T00:00:00.000Z',
        current_period_end: '2026-09-11T00:00:00.000Z',
        last_synced_at: '2026-08-11T01:00:00.000Z'
      },
      error: null
    });

    await service.load();

    expect(service.account()?.stripeCustomerId).toBe('cus_test');
    expect(service.account()?.unitAmount).toBe(499);
    expect(service.hasSubscription()).toBeTrue();
    expect(service.hasPaidAccess()).toBeTrue();
    expect(service.error()).toBeNull();
  });

  it('requests a hosted monthly Checkout destination', async () => {
    invoke.and.resolveTo({
      data: { url: 'https://checkout.stripe.com/c/pay/test' },
      error: null
    });

    const url = await service.startCheckout('month');

    expect(invoke).toHaveBeenCalledWith('create-stripe-checkout', { body: { interval: 'month' } });
    expect(url).toBe('https://checkout.stripe.com/c/pay/test');
    expect(service.action()).toBeNull();
  });

  it('loads a safe invoice projection through the authenticated function', async () => {
    invoke.and.resolveTo({
      data: {
        invoices: [{
          id: 'in_test',
          number: 'CAT-0001',
          createdAt: '2026-08-12T00:00:00.000Z',
          status: 'paid',
          total: 499,
          currency: 'usd',
          invoicePdf: 'https://pay.stripe.com/invoice/test/pdf',
          hostedInvoiceUrl: 'javascript:alert(1)'
        }]
      },
      error: null
    });

    await service.loadInvoices();

    expect(invoke).toHaveBeenCalledWith('list-stripe-invoices', { body: {} });
    expect(service.invoices()[0].invoicePdf).toBe('https://pay.stripe.com/invoice/test/pdf');
    expect(service.invoices()[0].hostedInvoiceUrl).toBeNull();
    expect(service.invoiceError()).toBeNull();
  });

  it('rejects an invalid redirect returned by the billing boundary', async () => {
    invoke.and.resolveTo({ data: { url: 'javascript:alert(1)' }, error: null });

    expect(await service.openPortal()).toBeNull();
    expect(service.error()).toBe('The billing request could not be completed.');
  });

  it('refreshes billing through the authenticated reconciliation boundary', async () => {
    invoke.and.resolveTo({ data: { synced: true }, error: null });

    expect(await service.refresh()).toBeTrue();
    expect(invoke).toHaveBeenCalledWith('sync-stripe-billing', { body: {} });
    expect(service.action()).toBeNull();
  });

  it('identifies an incomplete billing schema from a Supabase error object', async () => {
    maybeSingle.and.resolveTo({
      data: null,
      error: { message: "Could not find the 'scheduled_cancel_at' column in the schema cache" }
    });

    await service.load();

    expect(service.error()).toBe('Billing setup is still being applied. Try again in a moment.');
  });
});
