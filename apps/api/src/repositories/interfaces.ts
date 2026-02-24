/**
 * Repository interfaces — async contracts that both in-memory and
 * Drizzle/PG implementations must satisfy.
 *
 * Every function returns a Promise so that routes can remain
 * implementation-agnostic.
 */

// ── Record types (plain data, no ORM coupling) ─────────────────

export interface SessionRecord {
    id: string;
    organizationId: string;
    clinicianId: string;
    patientId?: string;
    status: string;
    joints: string[];
    createdAt: string;
    updatedAt: string;
}

export interface MeasurementRecord {
    id: string;
    sessionId: string;
    joint: string;
    movement: string;
    side: string;
    romDegrees: number;
    confidenceScore: number;
    qualityFlags: { code: string; message: string; severity: string }[];
    algorithmVersion: string;
    captureDurationMs: number;
    createdAt: string;
}

export interface NoteBlock {
    id: string;
    type: string;
    content: string;
}

export interface NoteRecord {
    id: string;
    sessionId: string;
    status: string;
    blocks: NoteBlock[];
    createdAt: string;
    updatedAt: string;
}

export interface AuditEventRecord {
    id: string;
    eventType: string;
    entityType: string;
    entityId: string;
    actorId: string;
    organizationId: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}

export interface UserRecord {
    id: string;
    organizationId: string;
    email: string;
    passwordHash: string;
    displayName?: string;
    role: string;
    onboardingCompleted: boolean;
    country?: string;
    specialty?: string;
}

// ── V2 Commercial Record Types ──────────────────────────────────

export interface OrgRecord {
    id: string;
    name: string;
    billingEmail?: string;
    stripeCustomerId?: string;
    monthlySessionCount: number;
    billingCycleStart?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionRecord {
    id: string;
    organizationId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    plan: 'solo';
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PatientLinkRecord {
    id: string;
    token: string;
    sessionId: string;
    organizationId: string;
    joints: string[];
    expiresAt: string;
    usedAt?: string;
    createdAt: string;
}

export interface StripeEventRecord {
    id: string;
    stripeEventId: string;
    type: string;
    processedAt: string;
}

// ── Repository contracts ───────────────────────────────────────

export interface SessionRepo {
    create(data: {
        organizationId: string;
        clinicianId: string;
        patientId?: string;
        joints: string[];
    }): Promise<SessionRecord>;

    getById(id: string): Promise<SessionRecord | undefined>;

    listByOrg(organizationId: string): Promise<SessionRecord[]>;

    updateStatus(id: string, status: string): Promise<SessionRecord | undefined>;

    countByOrg(organizationId: string): Promise<number>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface MeasurementRepo {
    create(
        data: Omit<MeasurementRecord, 'id' | 'createdAt'>,
    ): Promise<MeasurementRecord>;

    getById(id: string): Promise<MeasurementRecord | undefined>;

    listBySession(sessionId: string): Promise<MeasurementRecord[]>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface NoteRepo {
    save(note: NoteRecord): Promise<NoteRecord>;

    getById(id: string): Promise<NoteRecord | undefined>;

    listBySession(sessionId: string): Promise<NoteRecord[]>;

    updateBlocks(id: string, blocks: NoteBlock[]): Promise<NoteRecord | undefined>;

    updateStatus(id: string, status: string): Promise<NoteRecord | undefined>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface AuditRepo {
    record(data: Omit<AuditEventRecord, 'id' | 'createdAt'>): Promise<AuditEventRecord>;

    list(filters: {
        entityType?: string;
        entityId?: string;
        organizationId?: string;
        eventType?: string;
    }): Promise<AuditEventRecord[]>;

    count(): Promise<number>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface UserRepo {
    create(data: {
        email: string;
        passwordHash: string;
        organizationId: string;
        role: string;
        displayName?: string;
    }): Promise<UserRecord>;

    getByEmail(email: string): Promise<UserRecord | undefined>;

    listByOrg(organizationId: string): Promise<UserRecord[]>;

    update(id: string, data: Partial<Pick<UserRecord, 'displayName' | 'onboardingCompleted' | 'country' | 'specialty'>>): Promise<UserRecord | undefined>;

    /** Test helper */
    _clear(): Promise<void>;
}

// ── V2 Commercial Repository Contracts ─────────────────────────

export interface OrgRepo {
    create(data: { name: string; billingEmail?: string }): Promise<OrgRecord>;

    getById(id: string): Promise<OrgRecord | undefined>;

    updateStripeCustomerId(id: string, stripeCustomerId: string): Promise<void>;

    incrementSessionCount(id: string): Promise<void>;

    resetSessionCount(id: string): Promise<void>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface SubscriptionRepo {
    create(
        data: Omit<SubscriptionRecord, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<SubscriptionRecord>;

    getActiveByOrgId(organizationId: string): Promise<SubscriptionRecord | undefined>;

    upsertByOrgId(
        organizationId: string,
        data: Partial<Omit<SubscriptionRecord, 'id' | 'organizationId' | 'createdAt'>>,
    ): Promise<SubscriptionRecord>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface PatientLinkRepo {
    create(data: {
        sessionId: string;
        organizationId: string;
        joints: string[];
        expiresAt: Date;
    }): Promise<PatientLinkRecord>;

    getByToken(token: string): Promise<PatientLinkRecord | undefined>;

    markUsed(token: string): Promise<void>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface StripeEventRepo {
    record(data: { stripeEventId: string; type: string }): Promise<StripeEventRecord>;

    getByStripeEventId(stripeEventId: string): Promise<StripeEventRecord | undefined>;

    /** Test helper */
    _clear(): Promise<void>;
}

export interface ClinicInviteRecord {
    id: string;
    token: string;
    organizationId: string;
    invitedEmail: string;
    invitedByUserId: string;
    role: string;
    expiresAt: string;
    acceptedAt?: string;
    createdAt: string;
}

export interface ClinicInviteRepo {
    create(data: {
        token: string;
        organizationId: string;
        invitedEmail: string;
        invitedByUserId: string;
        role: string;
        expiresAt: Date;
    }): Promise<ClinicInviteRecord>;

    getByToken(token: string): Promise<ClinicInviteRecord | undefined>;

    markAccepted(token: string): Promise<void>;

    /** Test helper */
    _clear(): Promise<void>;
}
