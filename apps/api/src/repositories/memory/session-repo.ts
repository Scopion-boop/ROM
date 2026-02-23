import { randomUUID } from 'node:crypto';
import type { SessionRepo, SessionRecord } from '../interfaces';

export function createMemorySessionRepo(): SessionRepo {
    const store = new Map<string, SessionRecord>();

    return {
        async create(data) {
            const now = new Date().toISOString();
            const record: SessionRecord = {
                id: randomUUID(),
                ...data,
                status: 'created',
                createdAt: now,
                updatedAt: now,
            };
            store.set(record.id, record);
            return record;
        },

        async getById(id) {
            return store.get(id);
        },

        async listByOrg(organizationId) {
            return [...store.values()].filter((s) => s.organizationId === organizationId);
        },

        async updateStatus(id, status) {
            const session = store.get(id);
            if (!session) return undefined;
            session.status = status;
            session.updatedAt = new Date().toISOString();
            return session;
        },

        async countByOrg(organizationId) {
            return [...store.values()].filter((s) => s.organizationId === organizationId).length;
        },

        async _clear() {
            store.clear();
        },
    };
}
