
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthNavigationService } from '../../core/auth/auth-navigation.service';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';
import { AuthPageFrameComponent } from './auth-page-frame.component';

@Component({
    selector: 'app-sign-in-page',
    imports: [
    AuthPageFrameComponent,
    UiButtonComponent,
    UiInputComponent
],
    templateUrl: './sign-in-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInPageComponent {
  protected readonly auth = inject(SupabaseAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authNavigation = inject(AuthNavigationService);
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly canSubmit = computed(
    () => this.email().trim().length > 0 && this.password().length > 0 && !this.auth.signingIn()
  );

  constructor() {
    this.auth.clearError();
  }

  protected async openForgotPassword(): Promise<void> {
    await this.router.navigateByUrl('/forgot-password');
  }

  protected async openSignUp(): Promise<void> {
    await this.router.navigateByUrl('/signup');
  }

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canSubmit()) {
      return;
    }

    const didSignIn = await this.auth.signIn(this.email(), this.password());

    if (didSignIn) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.authNavigation.navigateAfterSignIn(this.router, returnUrl);
    }
  }
}
