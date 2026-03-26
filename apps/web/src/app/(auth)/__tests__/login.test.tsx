import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/navigation before importing the component
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
  usePathname: () => '/',
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('a', { href, ...props }, children),
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn().mockReturnValue(null),
    getAuthHeaders: vi.fn().mockReturnValue({ 'X-Requested-With': 'XMLHttpRequest' }),
    isAuthenticated: vi.fn().mockReturnValue(false),
    apiUrl: 'http://localhost:4000',
  },
}));

import LoginPage from '../login/page';

describe('LoginPage', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page heading', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign in to PhysioLens')).toBeDefined();
  });

  it('renders the email input', () => {
    render(<LoginPage />);
    const emailInput = document.getElementById('login-email');
    expect(emailInput).not.toBeNull();
    expect((emailInput as HTMLInputElement).type).toBe('email');
  });

  it('renders the password input', () => {
    render(<LoginPage />);
    const passwordInput = document.getElementById('login-password');
    expect(passwordInput).not.toBeNull();
    expect((passwordInput as HTMLInputElement).type).toBe('password');
  });

  it('renders the sign-in submit button', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).type).toBe('submit');
  });

  it('renders a link to the register page', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: 'Start free' });
    expect(link).toBeDefined();
    expect((link as HTMLAnchorElement).href).toContain('/register');
  });

  it('renders the forgot password button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Forgot your password?' })).toBeDefined();
  });

  it('renders the subheading copy', () => {
    render(<LoginPage />);
    expect(screen.getByText('AI-powered ROM measurement for clinicians')).toBeDefined();
  });

  it('accepts typed values into the email field', () => {
    render(<LoginPage />);
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'physio@clinic.com' } });
    expect(emailInput.value).toBe('physio@clinic.com');
  });

  it('accepts typed values into the password field', () => {
    render(<LoginPage />);
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    expect(passwordInput.value).toBe('secret123');
  });

  it('submit button is enabled when form is idle', () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('shows an error message when the API returns a failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<LoginPage />);

    fireEvent.change(document.getElementById('login-email') as HTMLInputElement, {
      target: { value: 'bad@user.com' },
    });
    fireEvent.change(document.getElementById('login-password') as HTMLInputElement, {
      target: { value: 'wrongpass' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
  });

  it('shows a network error message when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    render(<LoginPage />);

    fireEvent.change(document.getElementById('login-email') as HTMLInputElement, {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(document.getElementById('login-password') as HTMLInputElement, {
      target: { value: 'password123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeDefined();
    });
  });

  it('does not show an error banner on initial render', () => {
    render(<LoginPage />);
    // The error div only renders when error state is non-empty, so
    // neither "Invalid credentials" nor "Network error" should appear.
    expect(screen.queryByText('Invalid credentials')).toBeNull();
    expect(screen.queryByText('Network error. Please try again.')).toBeNull();
  });
});
