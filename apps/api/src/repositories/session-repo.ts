import { randomUUID } from 'node:crypto';

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

/**
 * In-memory session store (placeholder for PostgreSQL).
 */
const sessions: Map<string, SessionRecord> = new Map();

export function createSession(data: {
    organizationId: string;
    clinicianId: string;
    patientId?: string;
    joints: string[];
}): SessionRecord {
    const now = new Date().toISOString();
    const record: SessionRecord = {
        id: randomUUID(),
        ...data,
        status: 'created',
        createdAt: now,
        updatedAt: now,
    };
    sessions.set(record.id, record);
    return record;
}

export function getSession(id: string): SessionRecord | undefined {
    return sessions.get(id);
}

export function listSessionsByOrg(organizationId: string): SessionRecord[] {
    return [...sessions.values()].filter((s) => s.organizationId === organizationId);
}

export function updateSessionStatus(id: string, status: string): SessionRecord | undefined {
    const session = sessions.get(id);
    if (!session) return undefined;
    session.status = status;
    session.updatedAt = new Date().toISOString();
    return session;
}

/** For testing: clear all sessions. */
export function _clearSessions(): void {
    sessions.clear();
}
