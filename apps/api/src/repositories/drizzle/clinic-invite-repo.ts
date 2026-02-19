import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { clinicInvites } from '../../db/schema';
import type { ClinicInviteRecord, ClinicInviteRepo } from '../interfaces';

function rowToRecord(row: typeof clinicInvites.$inferSelect): ClinicInviteRecord {
    return {
        id: row.id,
        token: row.token,
        organizationId: row.organizationId,
        invitedEmail: row.invitedEmail,
        invitedByUserId: row.invitedByUserId,
        role: row.role,
        expiresAt: row.expiresAt.toISOString(),
        acceptedAt: row.acceptedAt?.toISOString(),
        createdAt: row.createdAt.toISOString(),
    };
}

export function createDrizzleClinicInviteRepo(): ClinicInviteRepo {
    return {
        async create(data) {
            const db = getDb();
            const rows = await db
                .insert(clinicInvites)
                .values({
                    token: data.token,
                    organizationId: data.organizationId,
                    invitedEmail: data.invitedEmail,
                    invitedByUserId: data.invitedByUserId,
                    role: data.role,
                    expiresAt: data.expiresAt,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getByToken(token) {
            const db = getDb();
            const rows = await db
                .select()
                .from(clinicInvites)
                .where(eq(clinicInvites.token, token))
                .limit(1);
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async markAccepted(token) {
            const db = getDb();
            await db
                .update(clinicInvites)
                .set({ acceptedAt: new Date() })
                .where(eq(clinicInvites.token, token));
        },

        async _clear() {
            const db = getDb();
            await db.delete(clinicInvites);
        },
    };
}
