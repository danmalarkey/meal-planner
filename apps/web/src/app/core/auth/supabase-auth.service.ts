import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthChangeEvent, AuthError, Session, User } from '@supabase/supabase-js';
import { injectSupabaseClient } from '../supabase/supabase-client';

export interface SignUpResult {
  status: 'signed_in' | 'confirmation_required';
  accountCreated: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private readonly supabase = injectSupabaseClient();
  private readonly sessionState = signal<Session | null>(null);
  private readonly userState = signal<User | null>(null);
  private readonly readyState = signal(false);
  private readonly signingInState = signal(false);
  private readonly authActionPendingState = signal(false);
  private readonly authErrorState = signal<string | null>(null);

  readonly enabled = computed(() => !!this.supabase);
  readonly ready = this.readyState.asReadonly();
  readonly signingIn = this.signingInState.asReadonly();
  readonly authActionPending = this.authActionPendingState.asReadonly();
  readonly session = this.sessionState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly authError = this.authErrorState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userState());
  readonly userDisplayName = computed(() => {
    const user = this.userState();

    if (!user) {
      return null;
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const explicitName =
      (typeof metadata?.['full_name'] === 'string' ? metadata['full_name'] : null) ??
      (typeof metadata?.['name'] === 'string' ? metadata['name'] : null);

    if (explicitName?.trim()) {
      return explicitName.trim();
    }

    return null;
  });
  readonly userEmail = computed(() => this.userState()?.email?.trim() || null);
  readonly pendingEmail = computed(() => this.userState()?.new_email?.trim() || null);
  readonly userName = computed(() => this.userDisplayName() ?? this.userEmail() ?? 'Account');
  readonly userMeta = computed(() => {
    const displayName = this.userDisplayName();
    const email = this.userEmail();

    return displayName && email && displayName.toLocaleLowerCase() !== email.toLocaleLowerCase() ? email : null;
  });
  readonly userInitials = computed(() => {
    const name = this.userName().trim();

    if (!name) {
      return 'CA';
    }

    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  });

  constructor() {
    if (!this.supabase) {
      this.readyState.set(true);
      return;
    }

    void this.bootstrapSession();

    this.supabase.auth.onAuthStateChange((_: AuthChangeEvent, session) => {
      this.setSession(session);
      this.readyState.set(true);
      this.authErrorState.set(null);
    });
  }

  async signIn(email: string, password: string): Promise<boolean> {
    if (!this.supabase) {
      this.authErrorState.set('Sign in is temporarily unavailable. Try again later.');
      return false;
    }

    this.signingInState.set(true);
    this.authErrorState.set(null);

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      this.setSession(data.session);
      return !!data.session;
    } catch (error) {
      this.authErrorState.set(this.normalizeAuthError(error));
      return false;
    } finally {
      this.signingInState.set(false);
    }
  }

  async signUp(
    name: string,
    email: string,
    password: string,
    emailRedirectTo: string
  ): Promise<SignUpResult | null> {
    if (!this.supabase) {
      this.authErrorState.set('Account creation is temporarily unavailable. Try again later.');
      return null;
    }

    this.authActionPendingState.set(true);
    this.authErrorState.set(null);

    try {
      const fullName = name.trim();
      const { data, error } = await this.supabase.auth.signUp({
        email: email.trim().toLocaleLowerCase(),
        password,
        options: {
          ...(fullName ? { data: { full_name: fullName } } : {}),
          emailRedirectTo
        }
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        this.setSession(data.session);
        return { status: 'signed_in', accountCreated: true };
      }

      return {
        status: 'confirmation_required',
        accountCreated: (data.user?.identities?.length ?? 0) > 0
      };
    } catch (error) {
      this.authErrorState.set(this.normalizeAuthError(error, 'Could not create your account. Try again.'));
      return null;
    } finally {
      this.authActionPendingState.set(false);
    }
  }

  async signOut(): Promise<boolean> {
    if (!this.supabase) {
      return true;
    }

    const { error } = await this.supabase.auth.signOut();

    if (error) {
      this.authErrorState.set(this.normalizeAuthError(error));
      return false;
    }

    this.setSession(null);
    return true;
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<boolean> {
    if (!this.supabase) {
      this.authErrorState.set('Supabase runtime config is not available.');
      return false;
    }

    this.authActionPendingState.set(true);
    this.authErrorState.set(null);

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      this.authErrorState.set(this.normalizeAuthError(error, 'Could not send the password-reset link.'));
      return false;
    } finally {
      this.authActionPendingState.set(false);
    }
  }

  async updatePassword(password: string): Promise<boolean> {
    if (!this.supabase) {
      this.authErrorState.set('Supabase runtime config is not available.');
      return false;
    }

    if (!this.isAuthenticated()) {
      this.authErrorState.set('This password link is invalid or has expired.');
      return false;
    }

    this.authActionPendingState.set(true);
    this.authErrorState.set(null);

    try {
      const { error } = await this.supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      this.authErrorState.set(this.normalizeAuthError(error, 'Could not update the password.'));
      return false;
    } finally {
      this.authActionPendingState.set(false);
    }
  }

  async updateDisplayName(name: string): Promise<boolean> {
    if (!this.supabase || !this.isAuthenticated()) {
      this.authErrorState.set('Your account could not be updated. Sign in and try again.');
      return false;
    }

    const fullName = name.trim();
    if (!fullName) {
      this.authErrorState.set('Enter your name before saving.');
      return false;
    }

    this.authActionPendingState.set(true);
    this.authErrorState.set(null);

    try {
      const { data, error } = await this.supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        this.userState.set(data.user);
        const session = this.sessionState();
        if (session) {
          this.sessionState.set({ ...session, user: data.user });
        }
      }

      return true;
    } catch (error) {
      this.authErrorState.set(this.normalizeAuthError(error, 'Could not save your name.'));
      return false;
    } finally {
      this.authActionPendingState.set(false);
    }
  }

  async requestEmailChange(email: string, redirectTo: string): Promise<boolean> {
    if (!this.supabase || !this.isAuthenticated()) {
      this.authErrorState.set('Your email could not be updated. Sign in and try again.');
      return false;
    }

    const nextEmail = email.trim().toLocaleLowerCase();
    if (!nextEmail) {
      this.authErrorState.set('Enter your new email address before saving.');
      return false;
    }

    this.authActionPendingState.set(true);
    this.authErrorState.set(null);

    try {
      const { data, error } = await this.supabase.auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: redirectTo }
      );

      if (error) {
        throw error;
      }

      if (data.user) {
        this.userState.set(data.user);
        const session = this.sessionState();
        if (session) {
          this.sessionState.set({ ...session, user: data.user });
        }
      }

      return true;
    } catch (error) {
      this.authErrorState.set(this.normalizeAuthError(error, 'Could not start the email change.'));
      return false;
    } finally {
      this.authActionPendingState.set(false);
    }
  }

  clearError(): void {
    this.authErrorState.set(null);
  }

  clearDeletedSession(): void {
    this.setSession(null);
    this.authErrorState.set(null);
  }

  private async bootstrapSession(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      this.authErrorState.set(this.normalizeAuthError(error));
      this.readyState.set(true);
      return;
    }

    this.setSession(data.session);
    this.readyState.set(true);
  }

  private setSession(session: Session | null): void {
    this.sessionState.set(session);
    this.userState.set(session?.user ?? null);
  }

  private normalizeAuthError(
    error: unknown,
    fallback = 'Couldn’t complete that request. Try again.'
  ): string {
    const message =
      error instanceof AuthError || error instanceof Error
        ? error.message.toLocaleLowerCase()
        : '';

    if (message.includes('invalid login credentials')) {
      return 'Email or password is incorrect.';
    }

    if (message.includes('email not confirmed')) {
      return 'Confirm your email before signing in.';
    }

    if (message.includes('signup') && message.includes('disabled')) {
      return 'Account creation is temporarily unavailable. Try again later.';
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Too many attempts. Wait a moment, then try again.';
    }

    return fallback;
  }
}
