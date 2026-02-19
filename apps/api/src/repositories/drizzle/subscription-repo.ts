import { eq, and, or } from 'drizzle-orm';
import { getDb } from '../../db';
import { subscriptions } from '../../db/schema';
import type { SubscriptionRepo, SubscriptionRecord } from '../interfaces';

function rowToRecord(row: typeof subscriptions.$inferSelect): SubscriptionRecord {
    return {
        id: row.id,
        organizationId: row.organizationId,
        stripeCustomerId: row.stripeCustomerId,
        stripeSubscriptionId: row.stripeSubscriptionId ?? undefined,
        stripePriceId: row.stripePriceId ?? undefined,
        plan: row.plan as SubscriptionRecord['plan'],
        status: row.status as SubscriptionRecord['status'],
        trialEndsAt: row.trialEndsAt?.toISOString(),
        currentPeriodEnd: row.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function createDrizzleSubscriptionRepo(): SubscriptionRepo {
    return {
        async create(data) {
            const db = getDb();
            const rows = await db
                .insert(subscriptions)
                .values({
                    organizationId: data.organizationId,
                    stripeCustomerId: data.stripeCustomerId,
                    stripeSubscriptionId: data.stripeSubscriptionId,
                    stripePriceId: data.stripePriceId,
                    plan: data.plan as typeof subscriptions.$inferInsert.plan,
                    status: data.status as typeof subscriptions.$inferInsert.status,
                    trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
                    currentPeriodEnd: data.currentPeriodEnd
                        ? new Date(data.currentPeriodEnd)
                        : undefined,
                    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getActiveByOrgId(organizationId) {
            const db = getDb();
            const rows = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.organizationId, organizationId),
                        or(
                            eq(subscriptions.status, 'active'),
                            eq(subscriptions.status, 'trialing'),
                        ),
                    ),
                )
                .limit(1);
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async upsertByOrgId(organizationId, data) {
            const db = getDb();
            const existing = await db
                .select()
                .from(subscriptions)
                .where(eq(subscriptions.organizationId, organizationId))
                .limit(1);

            if (existing.length > 0) {
                const rows = await db
                    .update(subscriptions)
                    .set({
                        ...(data.stripeCustomerId && { stripeCustomerId: data.stripeCustomerId }),
                        ...(data.stripeSubscriptionId !== undefined && {
                            stripeSubscriptionId: data.stripeSubscriptionId,
                        }),
                        ...(data.stripePriceId !== undefined && { stripePriceId: data.stripePriceId }),
                        ...(data.plan && {
                            plan: data.plan as typeof subscriptions.$inferInsert.plan,
                        }),
                        ...(data.status && {
                            status: data.status as typeof subscriptions.$inferInsert.status,
                        }),
                        ...(data.trialEndsAt !== undefined && {
                            trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
                        }),
                        ...(data.currentPeriodEnd !== undefined && {
                            currentPeriodEnd: data.currentPeriodEnd
                                ? new Date(data.currentPeriodEnd)
                                : null,
                        }),
                        ...(data.cancelAtPeriodEnd !== undefined && {
                            cancelAtPeriodEnd: data.cancelAtPeriodEnd,
                        }),
                        updatedAt: new Date(),
                    })
                    .where(eq(subscriptions.organizationId, organizationId))
                    .returning();
                return rowToRecord(rows[0]!);
            }

            // Insert new
            const rows = await db
                .insert(subscriptions)
                .values({
                    organizationId,
                    stripeCustomerId: data.stripeCustomerId ?? '',
                    stripeSubscriptionId: data.stripeSubscriptionId,
                    stripePriceId: data.stripePriceId,
                    plan: (data.plan ?? 'solo') as typeof subscriptions.$inferInsert.plan,
                    status: (data.status ?? 'active') as typeof subscriptions.$inferInsert.status,
                    cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async _clear() {
            const db = getDb();
            await db.delete(subscriptions);
        },
    };
}
