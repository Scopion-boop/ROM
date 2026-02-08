import { randomUUID } from 'node:crypto';

export interface AuditEvent {
    id: string;
    eventType: string;
    entityType: string;
    entityId: string;
    userId: string;
    organizationId: string;
    details: Record<string, unknown>;
    timestamp: string;
}

// Immutable append-only log — events can never be modified or deleted
const auditLog: AuditEvent[] = [];

export function recordEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    userId: string,
    organizationId: string,
    details: Record<string, unknown> = {},
): AuditEvent {
    const event: AuditEvent = {
        id: randomUUID(),
        eventType,
        entityType,
        entityId,
        userId,
        organizationId,
        details,
        timestamp: new Date().toISOString(),
    };
    auditLog.push(event);
    return event;
}

export function listEvents(filters: {
    entityType?: string;
    entityId?: string;
    organizationId?: string;
    eventType?: string;
}): AuditEvent[] {
    return auditLog.filter((e) => {
        if (filters.entityType && e.entityType !== filters.entityType) return false;
        if (filters.entityId && e.entityId !== filters.entityId) return false;
        if (filters.organizationId && e.organizationId !== filters.organizationId) return false;
        if (filters.eventType && e.eventType !== filters.eventType) return false;
        return true;
    });
}

export function getEventCount(): number {
    return auditLog.length;
}

/** Test helper only — not for production use */
export function _clearAuditLog(): void {
    auditLog.length = 0;
}
