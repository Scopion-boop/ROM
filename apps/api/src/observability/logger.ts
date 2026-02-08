/**
 * Structured JSON logger — PHI-safe by design.
 *
 * All log entries use JSON format for easy parsing by
 * observability platforms (CloudWatch, Datadog, etc.).
 *
 * CRITICAL: Never log patient names, measurement values,
 * note content, or other PHI. Only structured metadata.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  service: string;
  [key: string]: unknown;
}

const SERVICE_NAME = '@rom/api';

function formatEntry(level: LogLevel, message: string, meta: Record<string, unknown> = {}): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    ...meta,
  };
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(JSON.stringify(formatEntry('debug', message, meta)));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(JSON.stringify(formatEntry('info', message, meta)));
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(JSON.stringify(formatEntry('warn', message, meta)));
  },

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(JSON.stringify(formatEntry('error', message, meta)));
  },
};
