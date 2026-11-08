
import { ChangeDetectionStrategy, Component, computed, inject, signal, DOCUMENT } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseAuthService } from '../../core/auth/supabase-auth.service';
import { UiButtonComponent } from '../../ui/button/ui-button.component';
import { UiInputComponent } from '../../ui/input/ui-input.component';
import { UiToastService } from '../../ui/toast/ui-toast.service';
import { AuthPageFrameComponent } from './auth-page-frame.component';

@Component({
    selector: 'app-password-recovery-page',
    imports: [AuthPageFrameComponent, UiButtonComponent, UiInputComponent],
    template: `
    <app-auth-page-frame
      [cardTitle]="cardTitle()"
      [cardDescription]="cardDescription()"
      >
      @if (isRequestMode && !requestSent()) {
        <form class="auth-form" (submit)="handleResetRequest($event)">
          <ui-input
            label="Email"
            type="email"
            autocomplete="email"
            [value]="email()"
            [autofocusTarget]="true"
            (valueChange)="email.set($event)"
          ></ui-input>
          @if (auth.authError()) {
            <p class="auth-feedback auth-feedback--error" role="alert">
              {{ auth.authError() }}
            </p>
          }
          <div class="auth-form-actions">
            <ui-button
              type="submit"
              variant="primary-elevated"
              size="lg"
              [fullWidth]="true"
              [loading]="auth.authActionPending()"
              [loadingLabel]="'Sending link'"
              [disabled]="!canRequestReset()"
              >
              Send reset link
            </ui-button>
            <ui-button variant="ghost" [fullWidth]="true" (clicked)="openLogin()">
              Back to sign in
            </ui-button>
          </div>
        </form>
      } @else {
        @if (isRequestMode) {
          <section class="auth-completion" aria-live="polite">
            <p class="auth-feedback auth-feedback--success">
              If an account exists for <strong>{{ email().trim() }}</strong>, a password-reset link is on its way.
            </p>
            <p>Open the link in the email to return to Meal Planner and choose a new password.</p>
            <ui-button variant="ghost" [fullWidth]="true" (clicked)="openLogin()">
              Back to sign in
            </ui-button>
          </section>
        } @else {
          @if (!auth.ready()) {
            <p class="auth-feedback" aria-live="polite">Checking your secure link…</p>
          }
          @if (auth.ready() && !auth.isAuthenticated()) {
            <section class="auth-completion">
              <p class="auth-feedback auth-feedback--error" role="alert">
                This password link is invalid or has expired.
              </p>
              <ui-button variant="ghost" [fullWidth]="true" (clicked)="openForgotPassword()">
                Request a new reset link
              </ui-button>
            </section>
          } @else {
            @if (auth.ready()) {
              <form class="auth-form" (submit)="handlePasswordUpdate($event)">
                <ui-input
                  label="New password"
                  type="password"
                  autocomplete="new-password"
                  helperText="Use at least 8 characters."
                  [value]="password()"
                  [autofocusTarget]="true"
                  (valueChange)="password.set($event)"
                ></ui-input>
                <ui-input
                  label="Confirm new password"
                  type="password"
                  autocomplete="new-password"
                  [value]="confirmedPassword()"
                  [errorText]="passwordsMismatch() ? 'Passwords do not match.' : undefined"
                  (valueChange)="confirmedPassword.set($event)"
                ></ui-input>
                @if (auth.authError()) {
                  <p class="auth-feedback auth-feedback--error" role="alert">
                    {{ auth.authError() }}
                  </p>
                }
                <ui-button
                  type="submit"
                  variant="primary-elevated"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="auth.authActionPending()"
                  [loadingLabel]="'Saving password'"
                  [disabled]="!canUpdatePassword()"
                  >
                  {{ isInvitation ? 'Create password' : 'Save new password' }}
                </ui-button>
              </form>
            }
          }
        }
      }


    </app-auth-page-frame>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordRecoveryPageComponent {
  protected readonly auth = inject(SupabaseAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly toastService = inject(UiToastService);

  protected readonly isRequestMode = this.route.snapshot.data['mode'] !== 'update';
  protected readonly isInvitation =
    !this.isRequestMode && this.route.snapshot.queryParamMap.get('mode') === 'invite';
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmedPassword = signal('');
  protected readonly requestSent = signal(false);
  protected readonly cardTitle = computed(() => {
    if (this.isRequestMode) {
      return this.requestSent() ? 'Check your email' : 'Reset your password';
    }

    return this.isInvitation ? 'Create your Meal Planner password' : 'Choose a new password';
  });
  protected readonly cardDescription = computed(() => {
    if (this.isRequestMode) {
      return this.requestSent()
        ? 'Use the secure link in the message to continue.'
        : 'Enter the email address connected to your Meal Planner account.';
    }

    return this.isInvitation
      ? 'Finish setting up your invited account.'
      : 'Set the password you will use to sign in to Meal Planner.';
  });
  protected readonly passwordsMismatch = computed(
    () => this.confirmedPassword().length > 0 && this.password() !== this.confirmedPassword()
  );
  protected readonly canRequestReset = computed(
    () => this.email().trim().length > 0 && !this.auth.authActionPending()
  );
  protected readonly canUpdatePassword = computed(
    () =>
      this.auth.ready() &&
      this.auth.isAuthenticated() &&
      this.password().length >= 8 &&
      this.password() === this.confirmedPassword() &&
      !this.auth.authActionPending()
  );

  constructor() {
    this.auth.clearError();
  }

  protected async openLogin(): Promise<void> {
    await this.router.navigateByUrl('/signin');
  }

  protected async openForgotPassword(): Promise<void> {
    await this.router.navigateByUrl('/forgot-password');
  }

  protected async handleResetRequest(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canRequestReset()) {
      return;
    }

    const redirectUrl = new URL('/auth/update-password', this.document.location.origin).toString();
    const didSend = await this.auth.requestPasswordReset(this.email(), redirectUrl);

    if (didSend) {
      this.requestSent.set(true);
    }
  }

  protected async handlePasswordUpdate(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canUpdatePassword()) {
      return;
    }

    const didUpdate = await this.auth.updatePassword(this.password());

    if (didUpdate) {
      this.toastService.success(this.isInvitation ? 'Your account is ready.' : 'Password updated.');
      await this.router.navigateByUrl('/', { replaceUrl: true });
    }
  }
}
