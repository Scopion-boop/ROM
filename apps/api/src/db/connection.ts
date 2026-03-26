/**
 * PostgreSQL connection via postgres.js.
 *
 * Reads DATABASE_URL from process.env (loaded by dotenv).
 * When DATABASE_URL is absent the app runs with in-memory repos
 * (see repo-factory.ts), so this module is only imported when
 * a real DB connection is needed.
 */
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get (or create) the singleton Drizzle instance.
 * Throws if DATABASE_URL is not set.
 */
export function getDb() {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — cannot initialise Drizzle connection');
  }

  _client = postgres(url, { max: 10 });
  _db = drizzle(_client, { schema });
  return _db;
}

/**
 * Gracefully close the connection pool (for clean shutdown / tests).
 */
export async function closeDb(): Promise<void> {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}

/**
 * Check database connectivity for health checks.
 * Returns { healthy: true } if connection works, { healthy: false, error } otherwise.
 */
export async function checkDbHealth(): Promise<{ healthy: boolean; error?: string }> {
  // If DATABASE_URL is not set, database is not configured (using in-memory)
  if (!process.env.DATABASE_URL) {
    return { healthy: true }; // In-memory mode is always "healthy"
  }

  try {
    const db = getDb();
    // Execute a simple query to verify connection
    await db.execute('SELECT 1');
    return { healthy: true };
  } catch (err) {
    return {
      healthy: false,
      error: err instanceof Error ? err.message : 'Unknown database error',
    };
  }
}
