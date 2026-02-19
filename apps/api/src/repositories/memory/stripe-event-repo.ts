import { randomUUID } from 'node:crypto';
import type { StripeEventRepo, StripeEventRecord } from '../interfaces';

export function createMemoryStripeEventRepo(): StripeEventRepo {
    const store = new Map<string, StripeEventRecord>(); // keyed by stripeEventId

    return {
        async record(data) {
            const record: StripeEventRecord = {
                id: randomUUID(),
                stripeEventId: data.stripeEventId,
                type: data.type,
                processedAt: new Date().toISOString(),
            };
            store.set(data.stripeEventId, record);
            return record;
        },

        async getByStripeEventId(stripeEventId) {
            return store.get(stripeEventId);
        },

        async _clear() {
            store.clear();
        },
    };
}
