/**
 * Programmatic migration runner.
 *
 * Called on server startup to ensure the database schema is up-to-date.
 * Skipped when DATABASE_URL is absent (in-memory mode).
 */
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './connection';

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) return; // skip in-memory mode

  console.log('[db] Running migrations...');
  await migrate(getDb(), { migrationsFolder: './drizzle' });
  console.log('[db] Migrations complete');
}
