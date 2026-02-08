/**
 * Repository Factory — dual-mode singleton.
 *
 * When DATABASE_URL is set → creates Drizzle/PG repositories.
 * When DATABASE_URL is absent → creates in-memory repositories.
 *
 * All routes and services import repos from here, never from
 * concrete implementations directly.
 */
import type {
    SessionRepo,
    MeasurementRepo,
    NoteRepo,
    AuditRepo,
    UserRepo,
} from './interfaces';

import {
    createMemorySessionRepo,
    createMemoryMeasurementRepo,
    createMemoryNoteRepo,
    createMemoryAuditRepo,
    createMemoryUserRepo,
} from './memory';

export interface Repos {
    sessions: SessionRepo;
    measurements: MeasurementRepo;
    notes: NoteRepo;
    audit: AuditRepo;
    users: UserRepo;
}

let _instance: Repos | null = null;

function buildRepos(): Repos {
    if (process.env.DATABASE_URL) {
        // Dynamic import keeps postgres / drizzle out of the bundle
        // when running in-memory (tests).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const drizzle = require('./drizzle');
        return {
            sessions: drizzle.createDrizzleSessionRepo(),
            measurements: drizzle.createDrizzleMeasurementRepo(),
            notes: drizzle.createDrizzleNoteRepo(),
            audit: drizzle.createDrizzleAuditRepo(),
            users: drizzle.createDrizzleUserRepo(),
        };
    }

    return {
        sessions: createMemorySessionRepo(),
        measurements: createMemoryMeasurementRepo(),
        notes: createMemoryNoteRepo(),
        audit: createMemoryAuditRepo(),
        users: createMemoryUserRepo(),
    };
}

/** Get the singleton repo set. */
export function getRepos(): Repos {
    _instance ??= buildRepos();
    return _instance;
}

/** Reset singleton (for tests). */
export function _resetRepos(): void {
    _instance = null;
}
