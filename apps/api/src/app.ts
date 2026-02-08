import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { sessionRouter } from './routes/sessions';
import { measurementRouter } from './routes/measurements';
import { noteRouter } from './routes/notes';
import { exportRouter } from './routes/export';
import { requestLogger } from './middleware/request-logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
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

// Fallback
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

export { app };
