import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: ['**/drizzle/__tests__/**', '**/node_modules/**'],
    },
});
