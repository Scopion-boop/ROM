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
    role: string;
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
    }): Promise<UserRecord>;

    getByEmail(email: string): Promise<UserRecord | undefined>;

    /** Test helper */
    _clear(): Promise<void>;
}
