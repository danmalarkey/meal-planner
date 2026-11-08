import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { requiredEnvironmentValue } from './environment.ts';

export function createServiceSupabase(): SupabaseClient {
  return createClient(
    requiredEnvironmentValue('SUPABASE_URL'),
    requiredEnvironmentValue('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
