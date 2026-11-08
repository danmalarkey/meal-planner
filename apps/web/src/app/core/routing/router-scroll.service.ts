import { Injectable, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RouterScrollService {
  private readonly router = inject(Router);
  private readonly scrollPositions = new Map<string, readonly [number, number]>();

  private lastSuccessfulUrl = this.router.url || '/';
  private lastNavigationTrigger: NavigationStart['navigationTrigger'] = 'imperative';

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.scrollPositions.set(this.lastSuccessfulUrl, [window.scrollX, window.scrollY]);
        this.lastNavigationTrigger = event.navigationTrigger;
        return;
      }

      if (!(event instanceof NavigationEnd)) {
        return;
      }

      const nextUrl = event.urlAfterRedirects;
      const previousPath = this.getPathname(this.lastSuccessfulUrl);
      const nextPath = this.getPathname(nextUrl);

      if (this.lastNavigationTrigger === 'popstate') {
        const storedPosition = this.scrollPositions.get(nextUrl);

        if (storedPosition) {
          window.scrollTo({ left: storedPosition[0], top: storedPosition[1], behavior: 'auto' });
        } else {
          window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
        }
      } else if (nextPath !== previousPath) {
        window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
      }

      this.lastSuccessfulUrl = nextUrl;
      this.lastNavigationTrigger = 'imperative';
    });
  }

  private getPathname(url: string): string {
    const [pathWithOptionalFragment] = url.split('?');
    const [path] = pathWithOptionalFragment.split('#');

    return path || '/';
  }
}
