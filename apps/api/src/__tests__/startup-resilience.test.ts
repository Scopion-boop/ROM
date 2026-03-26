import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Startup resilience — optional env vars', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    saved.RESEND_API_KEY = process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    // Restore originals so other tests are unaffected
    if (saved.STRIPE_SECRET_KEY !== undefined)
      process.env.STRIPE_SECRET_KEY = saved.STRIPE_SECRET_KEY;
    else delete process.env.STRIPE_SECRET_KEY;
    if (saved.RESEND_API_KEY !== undefined) process.env.RESEND_API_KEY = saved.RESEND_API_KEY;
    else delete process.env.RESEND_API_KEY;
  });

  it('app module loads without STRIPE_SECRET_KEY', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    // Dynamic import bypasses vitest module cache when combined with query param
    const { app } = await import(`../app?stripe_test=${Date.now()}`);
    expect(app).toBeDefined();
  });

  it('app module loads without RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;
    const { app } = await import(`../app?resend_test=${Date.now()}`);
    expect(app).toBeDefined();
  });

  it('app module loads without both optional service keys', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;
    const { app } = await import(`../app?both_test=${Date.now()}`);
    expect(app).toBeDefined();
  });
});
