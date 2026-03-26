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

import RegisterPage from '../register/page';

describe('RegisterPage', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // RegisterPage wraps RegisterForm in <Suspense>, so we wait for it to settle.
  async function renderAndWait() {
    const result = render(<RegisterPage />);
    // Wait for Suspense to resolve (RegisterForm renders synchronously but
    // Suspense can defer one paint cycle in some React versions).
    await waitFor(() => {
      expect(document.getElementById('reg-name')).not.toBeNull();
    });
    return result;
  }

  it('renders the page heading', async () => {
    await renderAndWait();
    expect(screen.getByText('Create your account')).toBeDefined();
  });

  it('renders the full name input', async () => {
    await renderAndWait();
    const nameInput = document.getElementById('reg-name');
    expect(nameInput).not.toBeNull();
    expect((nameInput as HTMLInputElement).type).toBe('text');
  });

  it('renders the clinic/practice name input when no invite token', async () => {
    await renderAndWait();
    const clinicInput = document.getElementById('reg-clinic');
    expect(clinicInput).not.toBeNull();
    expect((clinicInput as HTMLInputElement).placeholder).toBe('Auckland Physio Centre');
  });

  it('renders the role select', async () => {
    await renderAndWait();
    const roleSelect = document.getElementById('reg-role');
    expect(roleSelect).not.toBeNull();
    expect((roleSelect as HTMLSelectElement).tagName).toBe('SELECT');
  });

  it('renders both role options', async () => {
    await renderAndWait();
    expect(screen.getByRole('option', { name: 'Clinician' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Clinic Administrator' })).toBeDefined();
  });

  it('renders the email input', async () => {
    await renderAndWait();
    const emailInput = document.getElementById('reg-email');
    expect(emailInput).not.toBeNull();
    expect((emailInput as HTMLInputElement).type).toBe('email');
  });

  it('renders the password input', async () => {
    await renderAndWait();
    const passwordInput = document.getElementById('reg-password');
    expect(passwordInput).not.toBeNull();
    expect((passwordInput as HTMLInputElement).type).toBe('password');
  });

  it('renders the confirm password input', async () => {
    await renderAndWait();
    const confirmInput = document.getElementById('reg-confirm-password');
    expect(confirmInput).not.toBeNull();
    expect((confirmInput as HTMLInputElement).type).toBe('password');
  });

  it('renders the create account submit button', async () => {
    await renderAndWait();
    const button = screen.getByRole('button', { name: 'Create free account' });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).type).toBe('submit');
  });

  it('renders a link back to login', async () => {
    await renderAndWait();
    const link = screen.getByRole('link', { name: 'Sign in' });
    expect(link).toBeDefined();
    expect((link as HTMLAnchorElement).href).toContain('/login');
  });

  it('renders the subheading copy', async () => {
    await renderAndWait();
    expect(screen.getByText('Free plan — no credit card required')).toBeDefined();
  });

  it('submit button is enabled when form is idle', async () => {
    await renderAndWait();
    const button = screen.getByRole('button', { name: 'Create free account' }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('accepts typed values into the name field', async () => {
    await renderAndWait();
    const nameInput = document.getElementById('reg-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Dr. Jane Smith' } });
    expect(nameInput.value).toBe('Dr. Jane Smith');
  });

  it('accepts typed values into the email field', async () => {
    await renderAndWait();
    const emailInput = document.getElementById('reg-email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'jane@clinic.com' } });
    expect(emailInput.value).toBe('jane@clinic.com');
  });

  it('shows a password mismatch error without calling the API', async () => {
    await renderAndWait();

    fireEvent.change(document.getElementById('reg-name') as HTMLInputElement, {
      target: { value: 'Dr. Test' },
    });
    fireEvent.change(document.getElementById('reg-email') as HTMLInputElement, {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(document.getElementById('reg-password') as HTMLInputElement, {
      target: { value: 'password1' },
    });
    fireEvent.change(document.getElementById('reg-confirm-password') as HTMLInputElement, {
      target: { value: 'password2' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeDefined();
    });

    // API must not have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows an error when the API returns a failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    });

    await renderAndWait();

    fireEvent.change(document.getElementById('reg-name') as HTMLInputElement, {
      target: { value: 'Dr. Test' },
    });
    fireEvent.change(document.getElementById('reg-clinic') as HTMLInputElement, {
      target: { value: 'Test Clinic' },
    });
    fireEvent.change(document.getElementById('reg-email') as HTMLInputElement, {
      target: { value: 'dup@clinic.com' },
    });
    fireEvent.change(document.getElementById('reg-password') as HTMLInputElement, {
      target: { value: 'password123' },
    });
    fireEvent.change(document.getElementById('reg-confirm-password') as HTMLInputElement, {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeDefined();
    });
  });

  it('shows a network error message when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await renderAndWait();

    fireEvent.change(document.getElementById('reg-name') as HTMLInputElement, {
      target: { value: 'Dr. Test' },
    });
    fireEvent.change(document.getElementById('reg-clinic') as HTMLInputElement, {
      target: { value: 'Test Clinic' },
    });
    fireEvent.change(document.getElementById('reg-email') as HTMLInputElement, {
      target: { value: 'user@clinic.com' },
    });
    fireEvent.change(document.getElementById('reg-password') as HTMLInputElement, {
      target: { value: 'password123' },
    });
    fireEvent.change(document.getElementById('reg-confirm-password') as HTMLInputElement, {
      target: { value: 'password123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: 'Create free account' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeDefined();
    });
  });

  it('does not show an error banner on initial render', async () => {
    await renderAndWait();
    expect(screen.queryByText('Passwords do not match')).toBeNull();
    expect(screen.queryByText('Network error. Please try again.')).toBeNull();
  });
});
