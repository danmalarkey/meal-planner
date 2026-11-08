import { TestBed } from '@angular/core/testing';
import { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { SupabaseAuthService } from './supabase-auth.service';

describe('SupabaseAuthService', () => {
  let service: SupabaseAuthService;
  let authStateCallback: (event: AuthChangeEvent, session: Session | null) => void;
  let auth: {
    getSession: jasmine.Spy;
    onAuthStateChange: jasmine.Spy;
    resetPasswordForEmail: jasmine.Spy;
    signInWithPassword: jasmine.Spy;
    signUp: jasmine.Spy;
    updateUser: jasmine.Spy;
  };

  beforeEach(() => {
    auth = {
      getSession: jasmine.createSpy('getSession').and.resolveTo({
        data: { session: null },
        error: null
      }),
      onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.callFake(
        (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
          authStateCallback = callback;
          return { data: { subscription: { unsubscribe: () => undefined } } };
        }
      ),
      resetPasswordForEmail: jasmine.createSpy('resetPasswordForEmail').and.resolveTo({
        data: {},
        error: null
      }),
      signInWithPassword: jasmine.createSpy('signInWithPassword').and.resolveTo({
        data: { session: null },
        error: null
      }),
      signUp: jasmine.createSpy('signUp').and.resolveTo({
        data: { user: { id: 'user-1', identities: [{ id: 'identity-1' }] }, session: null },
        error: null
      }),
      updateUser: jasmine.createSpy('updateUser').and.resolveTo({
        data: { user: null },
        error: null
      })
    };
    TestBed.configureTestingModule({
      providers: [
        SupabaseAuthService,
        {
          provide: SUPABASE_CLIENT,
          useValue: { auth } as unknown as SupabaseClient
        }
      ]
    });

    service = TestBed.inject(SupabaseAuthService);
  });

  it('creates an account with normalized identity and profile metadata', async () => {
    const result = await service.signUp(
      '  Dan Malarkey  ',
      '  PERSON@example.com  ',
      'a-secure-password',
      'https://meal-planner.example/'
    );

    expect(result).toEqual({ status: 'confirmation_required', accountCreated: true });
    expect(auth.signUp).toHaveBeenCalledOnceWith({
      email: 'person@example.com',
      password: 'a-secure-password',
      options: {
        data: { full_name: 'Dan Malarkey' },
        emailRedirectTo: 'https://meal-planner.example/'
      }
    });
    expect(service.authActionPending()).toBeFalse();
  });

  it('creates an account without profile metadata when the optional name is blank', async () => {
    await service.signUp(
      '   ',
      'person@example.com',
      'a-secure-password',
      'https://meal-planner.example/'
    );

    expect(auth.signUp).toHaveBeenCalledOnceWith({
      email: 'person@example.com',
      password: 'a-secure-password',
      options: {
        emailRedirectTo: 'https://meal-planner.example/'
      }
    });
  });

  it('requests a reset link without disclosing account existence', async () => {
    const result = await service.requestPasswordReset(
      '  person@example.com  ',
      'https://meal-planner.example/auth/update-password'
    );

    expect(result).toBeTrue();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledOnceWith('person@example.com', {
      redirectTo: 'https://meal-planner.example/auth/update-password'
    });
    expect(service.authActionPending()).toBeFalse();
    expect(service.authError()).toBeNull();
  });

  it('updates the password only when the secure link established a session', async () => {
    authStateCallback('PASSWORD_RECOVERY', {
      user: { id: 'user-1' }
    } as Session);

    const result = await service.updatePassword('a-secure-password');

    expect(result).toBeTrue();
    expect(auth.updateUser).toHaveBeenCalledOnceWith({ password: 'a-secure-password' });
    expect(service.authActionPending()).toBeFalse();
  });

  it('establishes the authenticated session from an auth-state change', () => {
    authStateCallback('SIGNED_IN', {
      user: { id: 'user-1', email: 'dan@example.com' }
    } as Session);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.authError()).toBeNull();
  });

  it('rejects an expired password link before calling Supabase', async () => {
    const result = await service.updatePassword('a-secure-password');

    expect(result).toBeFalse();
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(service.authError()).toBe('This password link is invalid or has expired.');
  });

  it('saves a trimmed display name in user metadata', async () => {
    authStateCallback('SIGNED_IN', {
      user: { id: 'user-1', email: 'dan@example.com', user_metadata: {} }
    } as Session);
    auth.updateUser.and.resolveTo({
      data: {
        user: {
          id: 'user-1',
          email: 'dan@example.com',
          user_metadata: { full_name: 'Dan Malarkey' }
        } as unknown as User
      },
      error: null
    });

    const result = await service.updateDisplayName('  Dan Malarkey  ');

    expect(result).toBeTrue();
    expect(auth.updateUser).toHaveBeenCalledOnceWith({
      data: { full_name: 'Dan Malarkey' }
    });
    expect(service.userDisplayName()).toBe('Dan Malarkey');
  });

  it('starts a secure email change without replacing the current email before confirmation', async () => {
    authStateCallback('SIGNED_IN', {
      user: { id: 'user-1', email: 'dan@example.com', user_metadata: {} }
    } as Session);
    auth.updateUser.and.resolveTo({
      data: {
        user: {
          id: 'user-1',
          email: 'dan@example.com',
          new_email: 'new@example.com',
          user_metadata: {}
        } as unknown as User
      },
      error: null
    });

    const result = await service.requestEmailChange(
      '  NEW@example.com  ',
      'https://meal-planner.example/'
    );

    expect(result).toBeTrue();
    expect(auth.updateUser).toHaveBeenCalledOnceWith(
      { email: 'new@example.com' },
      { emailRedirectTo: 'https://meal-planner.example/' }
    );
    expect(service.userEmail()).toBe('dan@example.com');
    expect(service.pendingEmail()).toBe('new@example.com');
  });

});
