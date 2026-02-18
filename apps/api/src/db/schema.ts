/**
 * Drizzle ORM schema — PostgreSQL tables for the ROM platform.
 *
 * Mirrors the domain contracts in @rom/shared-types while adding
 * DB-specific concerns (auto-timestamps, PG enums, foreign keys).
 */
import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    text,
    real,
    integer,
    timestamp,
    jsonb,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────────────

export const sessionStatusEnum = pgEnum('session_status', [
    'created',
    'capture_in_progress',
    'capture_complete',
    'review',
    'finalized',
    'exported',
    'archived',
]);

export const noteStatusEnum = pgEnum('note_status', [
    'draft',
    'review',
    'approved',
    'exported',
]);

export const userRoleEnum = pgEnum('user_role', [
    'clinic_admin',
    'clinician',
    'reviewer',
    'support_readonly',
]);

// ── Tables ─────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id),
    email: varchar('email', { length: 320 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    displayName: varchar('display_name', { length: 255 }),
    role: userRoleEnum('role').notNull().default('clinician'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id),
    clinicianId: uuid('clinician_id')
        .notNull()
        .references(() => users.id),
    patientId: varchar('patient_id', { length: 128 }),
    status: sessionStatusEnum('status').notNull().default('created'),
    joints: jsonb('joints').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const measurements = pgTable('measurements', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
        .notNull()
        .references(() => sessions.id),
    joint: varchar('joint', { length: 64 }).notNull(),
    movement: varchar('movement', { length: 64 }).notNull(),
    side: varchar('side', { length: 16 }).notNull(),
    romDegrees: real('rom_degrees').notNull(),
    confidenceScore: real('confidence_score').notNull().default(0),
    qualityFlags: jsonb('quality_flags')
        .$type<{ code: string; message: string; severity: string }[]>()
        .notNull()
        .default([]),
    algorithmVersion: varchar('algorithm_version', { length: 32 }).notNull().default('v1.0'),
    captureDurationMs: integer('capture_duration_ms').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notes = pgTable('notes', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
        .notNull()
        .references(() => sessions.id),
    status: noteStatusEnum('status').notNull().default('draft'),
    blocks: jsonb('blocks')
        .$type<{ id: string; type: string; content: string }[]>()
        .notNull()
        .default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable('audit_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 128 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 128 }).notNull(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    organizationId: varchar('organization_id', { length: 128 }).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
