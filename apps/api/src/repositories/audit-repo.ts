import { randomUUID } from 'node:crypto';

export interface AuditRecord {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId: string;
  organizationId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const store = new Map<string, AuditRecord>();

export function saveAuditRecord(
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string,
  organizationId: string,
  metadata: Record<string, unknown> = {},
): AuditRecord {
  const record: AuditRecord = {
    id: randomUUID(),
    eventType,
    entityType,
    entityId,
    actorId,
    organizationId,
    metadata,
    createdAt: new Date().toISOString(),
  };
  store.set(record.id, record);
  return record;
}

export function listAuditRecords(organizationId: string): AuditRecord[] {
  return [...store.values()].filter((r) => r.organizationId === organizationId);
}

export function listAuditRecordsByEntity(entityId: string): AuditRecord[] {
  return [...store.values()].filter((r) => r.entityId === entityId);
}

/** Test helper */
export function _clearAuditRecords(): void {
  store.clear();
}
