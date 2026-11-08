
import { ChangeDetectionStrategy, Component, computed, inject, signal, DOCUMENT } from '@angular/core';
import { Router } from '@angular/router';
import { AuthNavigationService } from '../../core/auth/auth-navigation.service';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';
import { AuthPageFrameComponent } from './auth-page-frame.component';

@Component({
    selector: 'app-sign-up-page',
    imports: [AuthPageFrameComponent, UiButtonComponent, UiInputComponent],
    templateUrl: './sign-up-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpPageComponent {
  protected readonly auth = inject(SupabaseAuthService);
  private readonly authNavigation = inject(AuthNavigationService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmedPassword = signal('');
  protected readonly confirmationRequired = signal(false);
  protected readonly passwordsMismatch = computed(
    () => this.confirmedPassword().length > 0 && this.password() !== this.confirmedPassword()
  );
  protected readonly canSubmit = computed(
    () =>
      this.email().trim().length > 0 &&
      this.password().length >= 8 &&
      this.password() === this.confirmedPassword() &&
      !this.auth.authActionPending()
  );
  protected readonly cardTitle = computed(() =>
    this.confirmationRequired() ? 'Check your email' : 'Create your Meal Planner account'
  );
  protected readonly cardDescription = computed(() =>
    this.confirmationRequired()
      ? 'Confirm your email address to finish creating your account.'
      : 'Start a shared place for recipes, meal plans, and grocery lists.'
  );

  constructor() {
    this.auth.clearError();
  }

  protected async openSignIn(): Promise<void> {
    await this.router.navigateByUrl('/signin');
  }

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canSubmit()) {
      return;
    }

    const emailRedirectTo = new URL('/', this.document.location.origin).toString();
    const result = await this.auth.signUp(
      this.name(),
      this.email(),
      this.password(),
      emailRedirectTo
    );

    if (!result) {
      return;
    }

    if (result.status === 'signed_in') {
      await this.authNavigation.navigateAfterSignIn(this.router);
      return;
    }

    this.confirmationRequired.set(true);
  }
}
