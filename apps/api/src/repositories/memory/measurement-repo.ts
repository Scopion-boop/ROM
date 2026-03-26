import { randomUUID } from 'node:crypto';
import type { MeasurementRepo, MeasurementRecord } from '../interfaces';

export function createMemoryMeasurementRepo(): MeasurementRepo {
  const store = new Map<string, MeasurementRecord>();

  return {
    async create(data) {
      const record: MeasurementRecord = {
        id: randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      store.set(record.id, record);
      return record;
    },

    async getById(id) {
      return store.get(id);
    },

    async listBySession(sessionId) {
      return [...store.values()].filter((m) => m.sessionId === sessionId);
    },

    async _clear() {
      store.clear();
    },
  };
}
