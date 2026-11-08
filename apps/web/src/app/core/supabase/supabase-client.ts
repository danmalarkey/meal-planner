import { inject, InjectionToken, Provider } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRuntimeConfig } from '../runtime-config';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>('SUPABASE_CLIENT');

const AUTH_LOCK_WAIT_MS = 5_000;

async function waitForSupabaseAuthLock<R>(
  name: string,
  acquireTimeout: number,
  operation: () => Promise<R>
): Promise<R> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return operation();
  }

  const controller = new AbortController();
  const timeout = acquireTimeout === 0 ? AUTH_LOCK_WAIT_MS : acquireTimeout;
  const timeoutId =
    timeout > 0 ? globalThis.setTimeout(() => controller.abort(), timeout) : undefined;

  try {
    return await Promise.resolve().then(() =>
      navigator.locks.request(
        name,
        { mode: 'exclusive', signal: controller.signal },
        () => operation()
      )
    );
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
}

export function provideSupabaseClient(): Provider {
  return {
    provide: SUPABASE_CLIENT,
    useFactory: () => {
      const runtimeConfig = getRuntimeConfig();

      if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseAnonKey) {
        return null;
      }

      return createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          lock: waitForSupabaseAuthLock
        }
      });
    }
  };
}

export function injectSupabaseClient(): SupabaseClient | null {
  return inject(SUPABASE_CLIENT);
}
