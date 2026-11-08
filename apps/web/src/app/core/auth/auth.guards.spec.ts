import { canAccessAuthenticatedApp, getAuthReturnUrl } from './auth.guards';

describe('auth access policy', () => {
  it('allows an authenticated user into the app', () => {
    expect(canAccessAuthenticatedApp(true, true, true)).toBeTrue();
  });

  it('rejects an unauthenticated user when auth is configured', () => {
    expect(canAccessAuthenticatedApp(true, false, true)).toBeFalse();
  });

  it('fails closed when production auth configuration is missing', () => {
    expect(canAccessAuthenticatedApp(false, false, true)).toBeFalse();
  });

  it('allows the local shell when auth is not configured', () => {
    expect(canAccessAuthenticatedApp(false, false, false)).toBeTrue();
  });
});

describe('auth return URL policy', () => {
  it('keeps the ordinary home sign-in URL clean', () => {
    expect(getAuthReturnUrl('/')).toBeNull();
  });

  it('preserves a meaningful protected deep link', () => {
    expect(getAuthReturnUrl('/meals/recipe-123')).toBe('/meals/recipe-123');
  });

  it('does not redirect back into authentication routes', () => {
    expect(getAuthReturnUrl('/login')).toBeNull();
    expect(getAuthReturnUrl('/signin')).toBeNull();
    expect(getAuthReturnUrl('/auth/login')).toBeNull();
  });
});
