import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/drizzle/__tests__/**', '**/node_modules/**'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-for-testing-only-min-32-chars',
      STRIPE_SECRET_KEY: 'sk_test_fake_key_for_unit_tests_only',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_fake_webhook_secret_for_tests',
      RESEND_API_KEY: 're_test_fake_key_for_unit_tests',
      FROM_EMAIL: 'test@example.com',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.ts', 'src/db/migrate.ts'],
    },
  },
});
