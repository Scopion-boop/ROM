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
                onboardingCompleted: false,
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

        async update(id, data) {
            const record = [...store.values()].find(u => u.id === id);
            if (!record) return undefined;
            if (data.displayName !== undefined) record.displayName = data.displayName;
            if (data.onboardingCompleted !== undefined) record.onboardingCompleted = data.onboardingCompleted;
            if (data.country !== undefined) record.country = data.country;
            if (data.specialty !== undefined) record.specialty = data.specialty;
            store.set(record.email, record);
            return record;
        },

        async _clear() {
            store.clear();
        },
    };
}
