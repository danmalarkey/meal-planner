import { createClient, SupabaseClient, User } from 'npm:@supabase/supabase-js@2';
import { requiredEnvironmentValue } from './environment.ts';
import { HttpError } from './http.ts';

export interface AuthenticatedSupabase {
  client: SupabaseClient;
  user: User;
}

export async function createAuthenticatedSupabase(request: Request): Promise<AuthenticatedSupabase> {
  const authorization = request.headers.get('Authorization');

  if (!authorization) {
    throw new HttpError(401, 'Authentication is required.');
  }

  const client = createClient(
    requiredEnvironmentValue('SUPABASE_URL'),
    requiredEnvironmentValue('SUPABASE_ANON_KEY'),
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new HttpError(401, 'Your session is no longer valid.');
  }

  return { client, user: data.user };
}
