import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: ['**/drizzle/__tests__/**', '**/node_modules/**'],
        env: {
            JWT_SECRET: 'test-jwt-secret-for-testing-only-min-32-chars',
            STRIPE_SECRET_KEY: 'sk_test_fake_key_for_unit_tests_only',
            STRIPE_WEBHOOK_SECRET: 'whsec_test_fake_webhook_secret_for_tests',
            RESEND_API_KEY: 're_test_fake_key_for_unit_tests',
            FROM_EMAIL: 'test@example.com',
        },
    },
});
