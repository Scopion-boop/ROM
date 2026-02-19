import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

// Stripe webhook — MUST be before express.json() to preserve raw body
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingWebhookHandler);

app.use(express.json({ limit: '1mb' }));

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
