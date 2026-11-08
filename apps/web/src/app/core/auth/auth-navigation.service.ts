import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthNavigationService {
  private readonly defaultSignedInRoute = '/';
  private readonly signedOutRoute = '/signin';

  async navigateAfterSignIn(router: Router, returnUrl?: string | null): Promise<void> {
    await router.navigateByUrl(this.normalizeReturnUrl(returnUrl) ?? this.defaultSignedInRoute, {
      replaceUrl: true
    });
    this.scrollToTop();
  }

  async navigateAfterSignOut(router: Router): Promise<void> {
    await router.navigateByUrl(this.signedOutRoute, { replaceUrl: true });
    this.scrollToTop();
  }

  private normalizeReturnUrl(returnUrl?: string | null): string | null {
    if (
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//') ||
      returnUrl.startsWith('/auth') ||
      returnUrl.startsWith('/signin') ||
      returnUrl.startsWith('/login') ||
      returnUrl.startsWith('/signup')
    ) {
      return null;
    }

    return returnUrl;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
}
