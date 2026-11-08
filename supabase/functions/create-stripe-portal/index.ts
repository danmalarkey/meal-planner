import { createAuthenticatedSupabase } from '../_shared/authenticated-supabase.ts';
import { allowedRequestOrigin, handleCors } from '../_shared/cors.ts';
import { createServiceSupabase } from '../_shared/service-supabase.ts';
import { errorResponse, HttpError, jsonResponse } from '../_shared/http.ts';
import { assertMealPlannerStripeAccount, stripe } from '../_shared/stripe.ts';

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
    const { user } = await createAuthenticatedSupabase(request);
    const service = createServiceSupabase();
    const { data: account, error } = await service
      .from('billing_accounts')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle<{ stripe_customer_id: string }>();

    if (error) {
      throw error;
    }

    if (!account?.stripe_customer_id) {
      throw new HttpError(409, 'No billing account exists yet.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: `${origin}/?billing=portal`
    });

    return jsonResponse(request, { url: session.url });
  } catch (error) {
    return errorResponse(request, error, 'Billing management could not be opened.');
  }
});
