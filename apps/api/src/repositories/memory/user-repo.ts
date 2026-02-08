import { randomUUID } from 'node:crypto';
import type { UserRepo, UserRecord } from '../interfaces';

export function createMemoryUserRepo(): UserRepo {
    const store = new Map<string, UserRecord>();

    return {
        async create(data) {
            const record: UserRecord = {
                id: randomUUID(),
                ...data,
            };
            store.set(data.email, record);
            return record;
        },

        async getByEmail(email) {
            return store.get(email);
        },

        async _clear() {
            store.clear();
        },
    };
}
