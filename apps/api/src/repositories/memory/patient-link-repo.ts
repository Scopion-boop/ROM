import { randomBytes, randomUUID } from 'node:crypto';
import type { PatientLinkRepo, PatientLinkRecord } from '../interfaces';

export function createMemoryPatientLinkRepo(): PatientLinkRepo {
    const store = new Map<string, PatientLinkRecord>(); // keyed by token

    return {
        async create(data) {
            const token = randomBytes(32).toString('hex');
            const record: PatientLinkRecord = {
                id: randomUUID(),
                token,
                sessionId: data.sessionId,
                organizationId: data.organizationId,
                joints: data.joints,
                expiresAt: data.expiresAt.toISOString(),
                createdAt: new Date().toISOString(),
            };
            store.set(token, record);
            return record;
        },

        async getByToken(token) {
            return store.get(token);
        },

        async markUsed(token) {
            const rec = store.get(token);
            if (rec) {
                store.set(token, { ...rec, usedAt: new Date().toISOString() });
            }
        },

        async _clear() {
            store.clear();
        },
    };
}
