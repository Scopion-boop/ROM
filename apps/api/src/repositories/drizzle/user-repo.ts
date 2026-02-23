import { eq } from 'drizzle-orm';
import { getDb, users, organizations } from '../../db';
import type { UserRepo, UserRecord } from '../interfaces';

function rowToRecord(row: typeof users.$inferSelect): UserRecord {
    return {
        id: row.id,
        organizationId: row.organizationId,
        email: row.email,
        passwordHash: row.passwordHash,
        displayName: row.displayName ?? undefined,
        role: row.role,
        onboardingCompleted: row.onboardingCompleted,
        country: row.country ?? undefined,
        specialty: row.specialty ?? undefined,
    };
}

export function createDrizzleUserRepo(): UserRepo {
    return {
        async create(data) {
            const db = getDb();

            // Ensure the organization exists (FK constraint satisfaction)
            if (data.organizationId) {
                const existing = await db.select().from(organizations).where(eq(organizations.id, data.organizationId));
                if (existing.length === 0) {
                    await db.insert(organizations).values({ id: data.organizationId, name: data.organizationId });
                }
            }

            const rows = await db
                .insert(users)
                .values({
                    email: data.email,
                    passwordHash: data.passwordHash,
                    organizationId: data.organizationId,
                    role: data.role as typeof users.$inferInsert.role,
                    displayName: data.displayName,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getByEmail(email) {
            const db = getDb();
            const rows = await db.select().from(users).where(eq(users.email, email));
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async listByOrg(organizationId) {
            const db = getDb();
            const rows = await db.select().from(users).where(eq(users.organizationId, organizationId));
            return rows.map(rowToRecord);
        },

        async update(id, data) {
            const db = getDb();
            const updateData: Record<string, unknown> = { updatedAt: new Date() };
            if (data.displayName !== undefined) updateData.displayName = data.displayName;
            if (data.onboardingCompleted !== undefined) updateData.onboardingCompleted = data.onboardingCompleted;
            if (data.country !== undefined) updateData.country = data.country;
            if (data.specialty !== undefined) updateData.specialty = data.specialty;

            const rows = await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, id))
                .returning();
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async _clear() {
            const db = getDb();
            await db.delete(users);
        },
    };
}
