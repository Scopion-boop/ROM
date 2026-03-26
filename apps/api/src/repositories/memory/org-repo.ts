import { randomUUID } from 'node:crypto';
import type { OrgRepo, OrgRecord } from '../interfaces';

export function createMemoryOrgRepo(): OrgRepo {
  const store = new Map<string, OrgRecord>();

  return {
    async create(data) {
      const now = new Date().toISOString();
      const record: OrgRecord = {
        id: randomUUID(),
        name: data.name,
        billingEmail: data.billingEmail,
        monthlySessionCount: 0,
        billingCycleStart: now,
        createdAt: now,
        updatedAt: now,
      };
      store.set(record.id, record);
      return record;
    },

    async getById(id) {
      return store.get(id);
    },

    async updateStripeCustomerId(id, stripeCustomerId) {
      const rec = store.get(id);
      if (rec) {
        store.set(id, { ...rec, stripeCustomerId, updatedAt: new Date().toISOString() });
      }
    },

    async incrementSessionCount(id) {
      const rec = store.get(id);
      if (rec) {
        store.set(id, {
          ...rec,
          monthlySessionCount: rec.monthlySessionCount + 1,
          updatedAt: new Date().toISOString(),
        });
      }
    },

    async resetSessionCount(id) {
      const rec = store.get(id);
      if (rec) {
        const now = new Date().toISOString();
        store.set(id, {
          ...rec,
          monthlySessionCount: 0,
          billingCycleStart: now,
          updatedAt: now,
        });
      }
    },

    async _clear() {
      store.clear();
    },
  };
}
