import { eq } from 'drizzle-orm';
import { getDb, users } from '../../db';
import type { UserRepo, UserRecord } from '../interfaces';

function rowToRecord(row: typeof users.$inferSelect): UserRecord {
    return {
        id: row.id,
        organizationId: row.organizationId,
        email: row.email,
        passwordHash: row.passwordHash,
        role: row.role,
    };
}

export function createDrizzleUserRepo(): UserRepo {
    return {
        async create(data) {
            const db = getDb();
            const rows = await db
                .insert(users)
                .values({
                    email: data.email,
                    passwordHash: data.passwordHash,
                    organizationId: data.organizationId,
                    role: data.role as typeof users.$inferInsert.role,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getByEmail(email) {
            const db = getDb();
            const rows = await db.select().from(users).where(eq(users.email, email));
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async _clear() {
            const db = getDb();
            await db.delete(users);
        },
    };
}
