import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { patientLinks } from '../../db/schema';
import type { PatientLinkRepo, PatientLinkRecord } from '../interfaces';

function rowToRecord(row: typeof patientLinks.$inferSelect): PatientLinkRecord {
    return {
        id: row.id,
        token: row.token,
        sessionId: row.sessionId,
        organizationId: row.organizationId,
        joints: row.joints,
        expiresAt: row.expiresAt.toISOString(),
        usedAt: row.usedAt?.toISOString(),
        createdAt: row.createdAt.toISOString(),
    };
}

export function createDrizzlePatientLinkRepo(): PatientLinkRepo {
    return {
        async create(data) {
            const db = getDb();
            const token = randomBytes(32).toString('hex');
            const rows = await db
                .insert(patientLinks)
                .values({
                    token,
                    sessionId: data.sessionId,
                    organizationId: data.organizationId,
                    joints: data.joints,
                    expiresAt: data.expiresAt,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getByToken(token) {
            const db = getDb();
            const rows = await db
                .select()
                .from(patientLinks)
                .where(eq(patientLinks.token, token))
                .limit(1);
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async markUsed(token) {
            const db = getDb();
            await db
                .update(patientLinks)
                .set({ usedAt: new Date() })
                .where(eq(patientLinks.token, token));
        },

        async _clear() {
            const db = getDb();
            await db.delete(patientLinks);
        },
    };
}
