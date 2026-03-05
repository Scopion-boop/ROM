import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { sessionRouter } from './routes/sessions';
import { measurementRouter } from './routes/measurements';
import { noteRouter } from './routes/notes';
import { exportRouter } from './routes/export';
import { billingRouter, billingWebhookHandler } from './routes/billing';
import { clinicRouter } from './routes/clinic';
import { patientLinksRouter } from './routes/patient-links';
import { dashboardRouter } from './routes/dashboard';
import { requestLogger } from './middleware/request-logger';
import { rateLimit } from './middleware/rate-limit';
import { securityHeaders } from './middleware/security-headers';

const app: Express = express();

// Security middleware
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
      : undefined
  )
);
app.use(securityHeaders);
app.use(rateLimit());

// Cookie parser — required for httpOnly cookie auth
app.use(cookieParser());

// Stripe webhook — MUST be before express.json() to preserve raw body
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingWebhookHandler);

app.use(express.json({ limit: '1mb' }));

// CSRF protection for cookie-based auth
// Browsers won't send custom headers cross-origin without a CORS preflight,
// so requiring X-Requested-With on mutating requests blocks forged form posts.
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Skip CSRF for webhook endpoints (they use signature verification)
    if (req.path.startsWith('/api/billing/webhook')) return next();
    // Skip CSRF for API clients using Bearer token auth (not cookie-based)
    if (req.headers.authorization?.startsWith('Bearer ')) return next();
    // For cookie-based auth, require the custom header
    if (req.cookies?.pl_token && !req.headers['x-requested-with']) {
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
  }
  next();
});

// Logging
app.use(requestLogger);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/sessions', measurementRouter);
app.use('/api/sessions', noteRouter);
app.use('/api/notes', exportRouter);
app.use('/api', exportRouter);
app.use('/api/billing', billingRouter);
app.use('/api/clinic', clinicRouter);
app.use('/api/patient-links', patientLinksRouter);
app.use('/api/dashboard', dashboardRouter);

// Fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export { app };
