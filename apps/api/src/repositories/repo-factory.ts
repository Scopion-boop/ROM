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
    OrgRepo,
    SubscriptionRepo,
    PatientLinkRepo,
    StripeEventRepo,
    ClinicInviteRepo,
} from './interfaces';

import {
    createMemorySessionRepo,
    createMemoryMeasurementRepo,
    createMemoryNoteRepo,
    createMemoryAuditRepo,
    createMemoryUserRepo,
    createMemoryOrgRepo,
    createMemorySubscriptionRepo,
    createMemoryPatientLinkRepo,
    createMemoryStripeEventRepo,
    createMemoryClinicInviteRepo,
} from './memory';

export interface Repos {
    sessions: SessionRepo;
    measurements: MeasurementRepo;
    notes: NoteRepo;
    audit: AuditRepo;
    users: UserRepo;
    orgs: OrgRepo;
    subscriptions: SubscriptionRepo;
    patientLinks: PatientLinkRepo;
    stripeEvents: StripeEventRepo;
    clinicInvites: ClinicInviteRepo;
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
            orgs: drizzle.createDrizzleOrgRepo(),
            subscriptions: drizzle.createDrizzleSubscriptionRepo(),
            patientLinks: drizzle.createDrizzlePatientLinkRepo(),
            stripeEvents: drizzle.createDrizzleStripeEventRepo(),
            clinicInvites: drizzle.createDrizzleClinicInviteRepo(),
        };
    }

    return {
        sessions: createMemorySessionRepo(),
        measurements: createMemoryMeasurementRepo(),
        notes: createMemoryNoteRepo(),
        audit: createMemoryAuditRepo(),
        users: createMemoryUserRepo(),
        orgs: createMemoryOrgRepo(),
        subscriptions: createMemorySubscriptionRepo(),
        patientLinks: createMemoryPatientLinkRepo(),
        stripeEvents: createMemoryStripeEventRepo(),
        clinicInvites: createMemoryClinicInviteRepo(),
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
