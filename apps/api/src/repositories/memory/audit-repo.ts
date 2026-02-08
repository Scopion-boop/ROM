import { randomUUID } from 'node:crypto';
import type { AuditRepo, AuditEventRecord } from '../interfaces';

export function createMemoryAuditRepo(): AuditRepo {
    const log: AuditEventRecord[] = [];

    return {
        async record(data) {
            const event: AuditEventRecord = {
                id: randomUUID(),
                ...data,
                createdAt: new Date().toISOString(),
            };
            log.push(event);
            return event;
        },

        async list(filters) {
            return log.filter((e) => {
                if (filters.entityType && e.entityType !== filters.entityType) return false;
                if (filters.entityId && e.entityId !== filters.entityId) return false;
                if (filters.organizationId && e.organizationId !== filters.organizationId) return false;
                if (filters.eventType && e.eventType !== filters.eventType) return false;
                return true;
            });
        },

        async count() {
            return log.length;
        },

        async _clear() {
            log.length = 0;
        },
    };
}
