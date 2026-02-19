import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import { stripeWebhookEvents } from '../../db/schema';
import type { StripeEventRepo, StripeEventRecord } from '../interfaces';

function rowToRecord(row: typeof stripeWebhookEvents.$inferSelect): StripeEventRecord {
    return {
        id: row.id,
        stripeEventId: row.stripeEventId,
        type: row.type,
        processedAt: row.processedAt.toISOString(),
    };
}

export function createDrizzleStripeEventRepo(): StripeEventRepo {
    return {
        async record(data) {
            const db = getDb();
            const rows = await db
                .insert(stripeWebhookEvents)
                .values({
                    stripeEventId: data.stripeEventId,
                    type: data.type,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getByStripeEventId(stripeEventId) {
            const db = getDb();
            const rows = await db
                .select()
                .from(stripeWebhookEvents)
                .where(eq(stripeWebhookEvents.stripeEventId, stripeEventId))
                .limit(1);
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async _clear() {
            const db = getDb();
            await db.delete(stripeWebhookEvents);
        },
    };
}
