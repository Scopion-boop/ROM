import { randomUUID } from 'node:crypto';
import type { ClinicInviteRecord, ClinicInviteRepo } from '../interfaces';

export function createMemoryClinicInviteRepo(): ClinicInviteRepo {
  const store = new Map<string, ClinicInviteRecord>(); // keyed by token

  return {
    async create(data) {
      const record: ClinicInviteRecord = {
        id: randomUUID(),
        token: data.token,
        organizationId: data.organizationId,
        invitedEmail: data.invitedEmail,
        invitedByUserId: data.invitedByUserId,
        role: data.role,
        expiresAt: data.expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      };
      store.set(data.token, record);
      return record;
    },

    async getByToken(token) {
      return store.get(token);
    },

    async markAccepted(token) {
      const rec = store.get(token);
      if (rec) {
        store.set(token, { ...rec, acceptedAt: new Date().toISOString() });
      }
    },

    async _clear() {
      store.clear();
    },
  };
}
