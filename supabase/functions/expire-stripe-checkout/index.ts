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

    if (!allowedRequestOrigin(request)) {
      throw new HttpError(400, 'The app origin is not allowed.');
    }

    await assertMealPlannerStripeAccount();
    const { user } = await createAuthenticatedSupabase(request);
    const service = createServiceSupabase();
    const { data: attempt, error: attemptError } = await service
      .from('billing_checkout_attempts')
      .select('stripe_checkout_session_id')
      .eq('user_id', user.id)
      .maybeSingle<{ stripe_checkout_session_id: string | null }>();

    if (attemptError) throw attemptError;

    if (attempt?.stripe_checkout_session_id) {
      const session = await stripe.checkout.sessions.retrieve(attempt.stripe_checkout_session_id);

      if (session.status === 'open') {
        await stripe.checkout.sessions.expire(session.id);
      }
    }

    const { error: deleteError } = await service
      .from('billing_checkout_attempts')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return jsonResponse(request, { expired: true });
  } catch (error) {
    return errorResponse(request, error, 'Checkout could not be closed.');
  }
});
