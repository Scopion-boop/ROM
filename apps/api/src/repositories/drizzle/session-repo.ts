import { eq } from 'drizzle-orm';
import { getDb, sessions } from '../../db';
import type { SessionRepo, SessionRecord } from '../interfaces';

function rowToRecord(row: typeof sessions.$inferSelect): SessionRecord {
    return {
        id: row.id,
        organizationId: row.organizationId,
        clinicianId: row.clinicianId,
        patientId: row.patientId ?? undefined,
        status: row.status,
        joints: row.joints,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function createDrizzleSessionRepo(): SessionRepo {
    return {
        async create(data) {
            const db = getDb();
            const rows = await db
                .insert(sessions)
                .values({
                    organizationId: data.organizationId,
                    clinicianId: data.clinicianId,
                    patientId: data.patientId ?? null,
                    joints: data.joints,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getById(id) {
            const db = getDb();
            const rows = await db.select().from(sessions).where(eq(sessions.id, id));
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async listByOrg(organizationId) {
            const db = getDb();
            const rows = await db
                .select()
                .from(sessions)
                .where(eq(sessions.organizationId, organizationId));
            return rows.map(rowToRecord);
        },

        async updateStatus(id, status) {
            const db = getDb();
            const rows = await db
                .update(sessions)
                .set({
                    status: status as typeof sessions.$inferInsert.status,
                    updatedAt: new Date(),
                })
                .where(eq(sessions.id, id))
                .returning();
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async _clear() {
            const db = getDb();
            await db.delete(sessions);
        },
    };
}
