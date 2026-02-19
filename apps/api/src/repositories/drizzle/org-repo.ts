import { eq, sql } from 'drizzle-orm';
import { getDb, organizations } from '../../db';
import type { OrgRepo, OrgRecord } from '../interfaces';

function rowToRecord(row: typeof organizations.$inferSelect): OrgRecord {
    return {
        id: row.id,
        name: row.name,
        billingEmail: row.billingEmail ?? undefined,
        stripeCustomerId: row.stripeCustomerId ?? undefined,
        monthlySessionCount: row.monthlySessionCount,
        billingCycleStart: row.billingCycleStart?.toISOString(),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function createDrizzleOrgRepo(): OrgRepo {
    return {
        async create(data) {
            const db = getDb();
            const rows = await db
                .insert(organizations)
                .values({
                    name: data.name,
                    billingEmail: data.billingEmail,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getById(id) {
            const db = getDb();
            const rows = await db.select().from(organizations).where(eq(organizations.id, id));
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async updateStripeCustomerId(id, stripeCustomerId) {
            const db = getDb();
            await db
                .update(organizations)
                .set({ stripeCustomerId, updatedAt: new Date() })
                .where(eq(organizations.id, id));
        },

        async incrementSessionCount(id) {
            const db = getDb();
            await db
                .update(organizations)
                .set({
                    monthlySessionCount: sql`${organizations.monthlySessionCount} + 1`,
                    updatedAt: new Date(),
                })
                .where(eq(organizations.id, id));
        },

        async resetSessionCount(id) {
            const db = getDb();
            await db
                .update(organizations)
                .set({
                    monthlySessionCount: 0,
                    billingCycleStart: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(organizations.id, id));
        },

        async _clear() {
            const db = getDb();
            await db.delete(organizations);
        },
    };
}
