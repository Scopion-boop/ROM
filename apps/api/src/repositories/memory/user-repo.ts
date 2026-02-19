import { randomUUID } from 'node:crypto';
import type { UserRepo, UserRecord } from '../interfaces';

export function createMemoryUserRepo(): UserRepo {
    const store = new Map<string, UserRecord>(); // keyed by email

    return {
        async create(data) {
            const record: UserRecord = {
                id: randomUUID(),
                email: data.email,
                passwordHash: data.passwordHash,
                organizationId: data.organizationId,
                role: data.role,
                displayName: data.displayName,
            };
            store.set(data.email, record);
            return record;
        },

        async getByEmail(email) {
            return store.get(email);
        },

        async listByOrg(organizationId) {
            return [...store.values()].filter(u => u.organizationId === organizationId);
        },

        async _clear() {
            store.clear();
        },
    };
}
