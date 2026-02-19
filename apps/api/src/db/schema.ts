/**
 * Drizzle ORM schema — PostgreSQL tables for the ROM platform.
 *
 * Mirrors the domain contracts in @physiolens/shared-types while adding
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
    boolean,
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

export const planEnum = pgEnum('plan', ['solo', 'practice', 'enterprise']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
    'trialing',
    'active',
    'past_due',
    'canceled',
    'incomplete',
]);

// ── Tables ─────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    billingEmail: varchar('billing_email', { length: 320 }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 128 }),
    monthlySessionCount: integer('monthly_session_count').notNull().default(0),
    billingCycleStart: timestamp('billing_cycle_start', { withTimezone: true }).defaultNow(),
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
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    country: varchar('country', { length: 64 }),
    specialty: varchar('specialty', { length: 128 }),
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

// ── V2 Commercial Tables ────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id),
    stripeCustomerId: varchar('stripe_customer_id', { length: 128 }).notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 128 }),
    stripePriceId: varchar('stripe_price_id', { length: 128 }),
    plan: planEnum('plan').notNull().default('solo'),
    status: subscriptionStatusEnum('status').notNull().default('trialing'),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    stripeEventId: varchar('stripe_event_id', { length: 128 }).notNull().unique(),
    type: varchar('type', { length: 128 }).notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const patientLinks = pgTable('patient_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    token: text('token').notNull().unique(),
    sessionId: uuid('session_id')
        .notNull()
        .references(() => sessions.id),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id),
    joints: jsonb('joints').$type<string[]>().notNull().default([]),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clinicInvites = pgTable('clinic_invites', {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organizations.id),
    invitedEmail: varchar('invited_email', { length: 320 }).notNull(),
    invitedByUserId: uuid('invited_by_user_id')
        .notNull()
        .references(() => users.id),
    token: varchar('token', { length: 128 }).notNull().unique(),
    role: varchar('role', { length: 64 }).notNull().default('clinician'),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
