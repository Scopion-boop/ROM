import tseslint from 'typescript-eslint';

export default tseslint.config(
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
        },
    },
    {
        ignores: ['dist/', 'node_modules/', '**/*.test.ts', '**/*.spec.ts', '**/__tests__/'],
    },
);
