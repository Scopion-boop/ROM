/**
 * Test setup for Drizzle repository integration tests.
 *
 * Prerequisites:
 * - PostgreSQL test database must be running
 * - Set TEST_DATABASE_URL environment variable
 *
 * Example using Docker:
 *   docker run --name rom-test-db -p 5433:5432 -e POSTGRES_PASSWORD=test -d postgres:15
 *   TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/postgres
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema';

// ── Known fixture UUIDs ─────────────────────────────────────────
// These rows are seeded before each test and can be referenced directly.
export const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_ORG_2_ID = '00000000-0000-0000-0000-000000000005';
export const TEST_CLINICIAN_ID = '00000000-0000-0000-0000-000000000002';
export const TEST_CLINICIAN_2_ID = '00000000-0000-0000-0000-000000000003';
export const TEST_CLINICIAN_3_ID = '00000000-0000-0000-0000-000000000004';

let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get test database connection.
 * Throws if TEST_DATABASE_URL is not set.
 */
export function getTestDb() {
    if (testDb) return testDb;

    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
        throw new Error(
            'TEST_DATABASE_URL is not set. Please set it to a PostgreSQL test database URL.\n' +
            'Example: TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/postgres'
        );
    }

    testClient = postgres(url, { max: 5 });
    testDb = drizzle(testClient, { schema });
    return testDb;
}

/**
 * Setup test database: run migrations and prepare for tests.
 */
export async function setupTestDb() {
    try {
        // Ensure database connection is established
        getTestDb();
        console.log('[test-db] Test database connected');
    } catch (err) {
        console.error('[test-db] Failed to setup test database:', err);
        throw err;
    }
}

/**
 * Clean up test database: close connections.
 */
export async function teardownTestDb() {
    if (testClient) {
        await testClient.end();
        testClient = null;
        testDb = null;
        console.log('[test-db] Test database closed');
    }
}

/**
 * Clear all tables before each test.
 * Ensures test isolation.
 */
export async function clearAllTables() {
    const db = getTestDb();

    // Clear in reverse dependency order
    await db.delete(schema.measurements);
    await db.delete(schema.notes);
    await db.delete(schema.auditEvents);
    await db.delete(schema.sessions);
    await db.delete(schema.users);
    await db.delete(schema.organizations);
}

/**
 * Seed prerequisite FK parent rows (org + clinicians) with known IDs.
 * Called after clearAllTables so tests can create sessions/measurements
 * without worrying about FK violations.
 */
export async function seedTestFixtures() {
    const db = getTestDb();

    await db.insert(schema.organizations).values([
        { id: TEST_ORG_ID, name: 'Test Organization 1' },
        { id: TEST_ORG_2_ID, name: 'Test Organization 2' },
    ]);

    await db.insert(schema.users).values([
        {
            id: TEST_CLINICIAN_ID,
            organizationId: TEST_ORG_ID,
            email: 'clinician1@test.example',
            passwordHash: 'hash-placeholder-1',
        },
        {
            id: TEST_CLINICIAN_2_ID,
            organizationId: TEST_ORG_ID,
            email: 'clinician2@test.example',
            passwordHash: 'hash-placeholder-2',
        },
        {
            id: TEST_CLINICIAN_3_ID,
            organizationId: TEST_ORG_2_ID,
            email: 'clinician3@test.example',
            passwordHash: 'hash-placeholder-3',
        },
    ]);
}

/**
 * Setup hooks for integration tests.
 * Call this in your test suite's beforeAll/afterAll/beforeEach.
 */
export function setupIntegrationTestHooks() {
    beforeAll(async () => {
        await setupTestDb();
    });

    afterAll(async () => {
        await teardownTestDb();
    });

    beforeEach(async () => {
        await clearAllTables();
        await seedTestFixtures();
    });
}
