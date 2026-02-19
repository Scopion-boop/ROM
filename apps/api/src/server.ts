import { app } from './app';

const PORT = process.env.PORT ?? 4000;

/**
 * Validate required environment variables at startup.
 * Fail fast with clear error messages if any are missing.
 */
function validateEnvironment(): void {
    const required = ['JWT_SECRET'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error('FATAL: Missing required environment variables:', missing);
        console.error('Please set these variables in your .env file or secrets vault.');
        process.exit(1);
    }

    // Production-only requirements
    if (process.env.NODE_ENV === 'production') {
        const prodRequired = ['DATABASE_URL', 'CORS_ORIGIN'];
        const prodMissing = prodRequired.filter((key) => !process.env[key]);
        if (prodMissing.length > 0) {
            console.error('FATAL: Missing required production environment variables:', prodMissing);
            process.exit(1);
        }
    }

    // Warn about placeholder keys (non-fatal)
    const placeholders: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_placeholder',
        STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
        RESEND_API_KEY: 're_placeholder',
    };
    for (const [key, sentinel] of Object.entries(placeholders)) {
        if (process.env[key] === sentinel) {
            console.warn(`[api] WARNING: ${key} is set to a placeholder value`);
        }
    }

    console.log('[api] Environment validation passed');
}

// Validate environment before starting server
validateEnvironment();

app.listen(PORT, () => {
    console.log(`[api] listening on port ${PORT}`);
});
