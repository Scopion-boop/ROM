import { randomUUID } from 'node:crypto';
import type { SubscriptionRepo, SubscriptionRecord } from '../interfaces';

export function createMemorySubscriptionRepo(): SubscriptionRepo {
    const store = new Map<string, SubscriptionRecord>();

    return {
        async create(data) {
            const now = new Date().toISOString();
            const record: SubscriptionRecord = {
                id: randomUUID(),
                createdAt: now,
                updatedAt: now,
                ...data,
            };
            store.set(record.id, record);
            return record;
        },

        async getActiveByOrgId(organizationId) {
            for (const rec of store.values()) {
                if (
                    rec.organizationId === organizationId &&
                    (rec.status === 'active' || rec.status === 'trialing')
                ) {
                    return rec;
                }
            }
            return undefined;
        },

        async upsertByOrgId(organizationId, data) {
            // Find existing
            for (const [id, rec] of store.entries()) {
                if (rec.organizationId === organizationId) {
                    const updated: SubscriptionRecord = {
                        ...rec,
                        ...data,
                        updatedAt: new Date().toISOString(),
                    };
                    store.set(id, updated);
                    return updated;
                }
            }
            // Create new
            const now = new Date().toISOString();
            const record: SubscriptionRecord = {
                id: randomUUID(),
                organizationId,
                stripeCustomerId: data.stripeCustomerId ?? '',
                plan: data.plan ?? 'solo',
                status: data.status ?? 'active',
                cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
                ...data,
                createdAt: now,
                updatedAt: now,
            };
            store.set(record.id, record);
            return record;
        },

        async _clear() {
            store.clear();
        },
    };
}
