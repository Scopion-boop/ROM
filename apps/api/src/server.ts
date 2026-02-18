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

    console.log('[api] Environment validation passed');
}

// Validate environment before starting server
validateEnvironment();

app.listen(PORT, () => {
    console.log(`[api] listening on port ${PORT}`);
});
