import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthNavigationService } from '../core/auth/auth-navigation.service';
import { SupabaseAuthService } from '../core/auth/supabase-auth.service';
import { AccountMenuComponent } from '../features/account/account-menu.component';
import { UiBrandComponent } from '../ui/brand/ui-brand.component';
import { UiIconComponent } from '../ui/icon/ui-icon.component';

export type PrimaryNavigationSection = 'meal-plan' | 'groceries' | 'recipes' | null;

export function primaryNavigationSection(url: string): PrimaryNavigationSection {
  const [path, query = ''] = url.split('?');
  const returnTo = new URLSearchParams(query.split('#', 1)[0]).get('returnTo');

  if (path === '/meal-plan' || path.startsWith('/meal-plan/')) return 'meal-plan';
  if (path.startsWith('/recipes/') && returnTo?.startsWith('/meal-plan')) return 'meal-plan';
  if (path === '/groceries') return 'groceries';
  if (path === '/recipes' || path.startsWith('/recipes/') || path === '/favorites') return 'recipes';
  return null;
}

@Component({
  selector: 'app-shell-layout',
  imports: [
    AccountMenuComponent,
    RouterLink,
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
            <a
              routerLink="/meal-plan"
              [class.app-shell-link--active]="navigationSection() === 'meal-plan'"
              [attr.aria-current]="navigationSection() === 'meal-plan' ? 'page' : null"
            >
              <ui-icon class="app-shell-nav-icon" name="grid" size="sm"></ui-icon>
              <span>Meal plan</span>
            </a>
            <a
              routerLink="/groceries"
              [class.app-shell-link--active]="navigationSection() === 'groceries'"
              [attr.aria-current]="navigationSection() === 'groceries' ? 'page' : null"
            >
              <ui-icon class="app-shell-nav-icon" name="list" size="sm"></ui-icon>
              <span>Groceries</span>
            </a>
            <a
              routerLink="/recipes"
              [class.app-shell-link--active]="navigationSection() === 'recipes'"
              [attr.aria-current]="navigationSection() === 'recipes' ? 'page' : null"
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
  protected readonly navigationSection = computed(() => primaryNavigationSection(this.currentUrl()));

  protected async signOut(): Promise<void> {
    if (await this.auth.signOut()) {
      await this.authNavigation.navigateAfterSignOut(this.router);
    }
  }
}
