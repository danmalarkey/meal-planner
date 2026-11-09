import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthNavigationService } from '../core/auth/auth-navigation.service';
import { SupabaseAuthService } from '../core/auth/supabase-auth.service';
import { AccountMenuComponent } from '../features/account/account-menu.component';
import { UiBrandComponent } from '../ui/brand/ui-brand.component';
import { UiIconComponent } from '../ui/icon/ui-icon.component';

@Component({
  selector: 'app-shell-layout',
  imports: [
    AccountMenuComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    UiBrandComponent,
    UiIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      <header class="app-shell-header">
        <a class="app-shell-brand" routerLink="/meal-plan" aria-label="Meal Planner home">
          <ui-brand></ui-brand>
        </a>
        <div class="app-shell-nav-region">
          <nav class="app-shell-nav" aria-label="Primary navigation">
            <a routerLink="/meal-plan" routerLinkActive="app-shell-link--active">
              <ui-icon class="app-shell-nav-icon" name="grid" size="sm"></ui-icon>
              <span>Meal plan</span>
            </a>
            <a routerLink="/groceries" routerLinkActive="app-shell-link--active">
              <ui-icon class="app-shell-nav-icon" name="list" size="sm"></ui-icon>
              <span>Groceries</span>
            </a>
            <a
              routerLink="/recipes"
              [class.app-shell-link--active]="recipesNavigationActive()"
              [attr.aria-current]="recipesNavigationActive() ? 'page' : null"
            >
              <ui-icon class="app-shell-nav-icon" name="recipes" size="sm"></ui-icon>
              <span>Recipes</span>
            </a>
          </nav>
          @if (auth.enabled()) {
            <app-account-menu
              [userName]="auth.userName()"
              [userInitials]="auth.userInitials()"
              [userMeta]="auth.userMeta()"
              (signOutRequested)="signOut()"
            ></app-account-menu>
          }
        </div>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppShellLayoutComponent {
  private readonly router = inject(Router);
  private readonly authNavigation = inject(AuthNavigationService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );
  protected readonly auth = inject(SupabaseAuthService);
  protected readonly recipesNavigationActive = computed(() => {
    const path = this.currentUrl().split(/[?#]/, 1)[0];
    return path === '/recipes' || path.startsWith('/recipes/') || path === '/favorites';
  });

  protected async signOut(): Promise<void> {
    if (await this.auth.signOut()) {
      await this.authNavigation.navigateAfterSignOut(this.router);
    }
  }
}
