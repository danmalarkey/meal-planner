import { Injector, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupabaseAuthService } from './supabase-auth.service';

export function canAccessAuthenticatedApp(
  authEnabled: boolean,
  isAuthenticated: boolean,
  isProduction = environment.production
): boolean {
  return isAuthenticated || (!authEnabled && !isProduction);
}

async function waitForAuthReady(auth: SupabaseAuthService, injector: Injector): Promise<void> {
  if (!auth.enabled() || auth.ready()) {
    return;
  }

  await firstValueFrom(toObservable(auth.ready, { injector }).pipe(filter(Boolean), take(1)));
}

function createSignInRedirect(router: Router, attemptedUrl: string): UrlTree {
  const normalizedAttemptedUrl = getAuthReturnUrl(attemptedUrl);

  return router.createUrlTree(['/signin'], {
    queryParams: normalizedAttemptedUrl ? { returnUrl: normalizedAttemptedUrl } : undefined
  });
}

export function getAuthReturnUrl(attemptedUrl: string): string | null {
  if (
    !attemptedUrl ||
    attemptedUrl === '/' ||
    attemptedUrl.startsWith('/auth') ||
    attemptedUrl.startsWith('/signin') ||
    attemptedUrl.startsWith('/login')
  ) {
    return null;
  }

  return attemptedUrl;
}

export const requireAuthGuard: CanActivateFn = async (_, state) => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  await waitForAuthReady(auth, injector);

  if (canAccessAuthenticatedApp(auth.enabled(), auth.isAuthenticated())) {
    return true;
  }

  return createSignInRedirect(router, state.url);
};

export const requireAuthChildGuard: CanActivateChildFn = async (_, state) => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  await waitForAuthReady(auth, injector);

  if (canAccessAuthenticatedApp(auth.enabled(), auth.isAuthenticated())) {
    return true;
  }

  return createSignInRedirect(router, state.url);
};

export const redirectAuthenticatedUserGuard: CanActivateFn = async () => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  await waitForAuthReady(auth, injector);

  if (canAccessAuthenticatedApp(auth.enabled(), auth.isAuthenticated())) {
    return router.createUrlTree(['/']);
  }

  return true;
};

export const redirectAuthenticatedUserChildGuard: CanActivateChildFn = async () => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  const injector = inject(Injector);

  await waitForAuthReady(auth, injector);

  if (canAccessAuthenticatedApp(auth.enabled(), auth.isAuthenticated())) {
    return router.createUrlTree(['/']);
  }

  return true;
};
