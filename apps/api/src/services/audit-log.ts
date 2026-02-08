/**
 * Audit-log service — thin async façade over AuditRepo.
 *
 * Routes now call the repo directly via getRepos().audit.
 * This file only remains for backward-compat during migration.
 * It will be deleted once all consumers are on the factory pattern.
 */
import { getRepos } from '../repositories/repo-factory';
import type { AuditEventRecord } from '../repositories/interfaces';

export type { AuditEventRecord as AuditEvent } from '../repositories/interfaces';

export async function recordEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    userId: string,
    organizationId: string,
    details: Record<string, unknown> = {},
): Promise<AuditEventRecord> {
    return getRepos().audit.record({
        eventType,
        entityType,
        entityId,
        actorId: userId,
        organizationId,
        metadata: details,
    });
}

export async function listEvents(filters: {
    entityType?: string;
    entityId?: string;
    organizationId?: string;
    eventType?: string;
}): Promise<AuditEventRecord[]> {
    return getRepos().audit.list(filters);
}

export async function getEventCount(): Promise<number> {
    return getRepos().audit.count();
}

/** Test helper only — not for production use */
export async function _clearAuditLog(): Promise<void> {
    return getRepos().audit._clear();
}
