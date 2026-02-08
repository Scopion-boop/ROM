import { eq, and } from 'drizzle-orm';
import { getDb, auditEvents } from '../../db';
import type { AuditRepo, AuditEventRecord } from '../interfaces';

function rowToRecord(row: typeof auditEvents.$inferSelect): AuditEventRecord {
    return {
        id: row.id,
        eventType: row.eventType,
        entityType: row.entityType,
        entityId: row.entityId,
        actorId: row.actorId,
        organizationId: row.organizationId,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
    };
}

export function createDrizzleAuditRepo(): AuditRepo {
    return {
        async record(data) {
            const db = getDb();
            const rows = await db
                .insert(auditEvents)
                .values({
                    eventType: data.eventType,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    actorId: data.actorId,
                    organizationId: data.organizationId,
                    metadata: data.metadata,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async list(filters) {
            const db = getDb();
            const conditions = [];
            if (filters.entityType) conditions.push(eq(auditEvents.entityType, filters.entityType));
            if (filters.entityId) conditions.push(eq(auditEvents.entityId, filters.entityId));
            if (filters.organizationId) conditions.push(eq(auditEvents.organizationId, filters.organizationId));
            if (filters.eventType) conditions.push(eq(auditEvents.eventType, filters.eventType));

            const rows =
                conditions.length > 0
                    ? await db.select().from(auditEvents).where(and(...conditions))
                    : await db.select().from(auditEvents);

            return rows.map(rowToRecord);
        },

        async count() {
            const db = getDb();
            const rows = await db.select().from(auditEvents);
            return rows.length;
        },

        async _clear() {
            const db = getDb();
            await db.delete(auditEvents);
        },
    };
}
