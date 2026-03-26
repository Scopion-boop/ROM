import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authClient } from '../auth-client';

/**
 * auth-client uses httpOnly cookie-based auth:
 *  - login() is a no-op (server sets the cookie)
 *  - getToken() returns 'cookie-auth' sentinel when pl_token cookie is present
 *  - getAuthHeaders() returns { 'X-Requested-With': 'XMLHttpRequest' }
 *  - logout() clears the cookie and redirects to /login
 *
 * Tests run in jsdom which provides document.cookie natively.
 */

describe('authClient', () => {
  // Save original location so we can restore after logout tests
  const originalLocation = window.location;

  beforeEach(() => {
    // Clear cookies by expiring them
    document.cookie = 'pl_token=; path=/; max-age=0';
  });

  afterEach(() => {
    // Restore window.location if it was overridden
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('isAuthenticated() returns false when no cookie present', () => {
    expect(authClient.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated() returns true when pl_token cookie is set', () => {
    document.cookie = 'pl_token=some-value; path=/';
    expect(authClient.isAuthenticated()).toBe(true);
  });

  it('getToken() returns null when no cookie present', () => {
    expect(authClient.getToken()).toBeNull();
  });

  it('getToken() returns "cookie-auth" sentinel when cookie present', () => {
    document.cookie = 'pl_token=jwt-value; path=/';
    expect(authClient.getToken()).toBe('cookie-auth');
  });

  it('login() is a no-op and does not throw', () => {
    expect(() => authClient.login('any-token')).not.toThrow();
    // login is a no-op — cookie presence unchanged
  });

  it('getAuthHeaders() always returns X-Requested-With header', () => {
    const headers = authClient.getAuthHeaders();
    expect(headers).toEqual({ 'X-Requested-With': 'XMLHttpRequest' });
  });

  it('getAuthHeaders() returns same header regardless of auth state', () => {
    document.cookie = 'pl_token=tok; path=/';
    expect(authClient.getAuthHeaders()).toEqual({ 'X-Requested-With': 'XMLHttpRequest' });
  });

  it('logout() sets max-age=0 on the cookie and redirects', () => {
    document.cookie = 'pl_token=active; path=/';
    // Replace window.location to prevent actual navigation
    const locationMock = { href: '' } as Location;
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
      configurable: true,
    });

    authClient.logout();

    // After logout the token cookie should be expired
    expect(authClient.getToken()).toBeNull();
    expect(locationMock.href).toBe('/login');
  });

  it('apiUrl defaults to http://localhost:4000', () => {
    expect(authClient.apiUrl).toBe('http://localhost:4000');
  });
});
