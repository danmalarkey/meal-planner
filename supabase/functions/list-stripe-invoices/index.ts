import { createAuthenticatedSupabase } from '../_shared/authenticated-supabase.ts';
import { allowedRequestOrigin, handleCors } from '../_shared/cors.ts';
import { createServiceSupabase } from '../_shared/service-supabase.ts';
import { errorResponse, HttpError, jsonResponse } from '../_shared/http.ts';
import { assertMealPlannerStripeAccount, stripe } from '../_shared/stripe.ts';

interface BillingAccountRow {
  stripe_customer_id: string;
}

function safeStripeUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
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
    const { data: account, error } = await service
      .from('billing_accounts')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle<BillingAccountRow>();

    if (error) throw error;
    if (!account?.stripe_customer_id) {
      return jsonResponse(request, { invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: account.stripe_customer_id,
      status: 'paid',
      limit: 24
    });

    return jsonResponse(request, {
      invoices: invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        createdAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000).toISOString(),
        status: invoice.status ?? 'paid',
        total: invoice.total,
        currency: invoice.currency,
        invoicePdf: safeStripeUrl(invoice.invoice_pdf),
        hostedInvoiceUrl: safeStripeUrl(invoice.hosted_invoice_url)
      }))
    });
  } catch (error) {
    return errorResponse(request, error, 'Billing history could not be loaded.');
  }
});
