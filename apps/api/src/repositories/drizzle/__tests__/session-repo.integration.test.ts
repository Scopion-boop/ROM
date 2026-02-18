/**
 * Integration tests for Drizzle SessionRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 *
 * Run with: TEST_DATABASE_URL=postgresql://... npm test
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleSessionRepo } from '../session-repo';
import { setupIntegrationTestHooks } from './test-setup';

describe('DrizzleSessionRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleSessionRepo();

    describe('create()', () => {
        it('should create a session with all fields', async () => {
            const session = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                patientId: 'patient-001',
                joints: ['shoulder', 'knee'],
            });

            expect(session.id).toBeDefined();
            expect(session.organizationId).toBe('org-001');
            expect(session.clinicianId).toBe('clinician-001');
            expect(session.patientId).toBe('patient-001');
            expect(session.joints).toEqual(['shoulder', 'knee']);
            expect(session.status).toBe('created');
            expect(session.createdAt).toBeDefined();
            expect(session.updatedAt).toBeDefined();
        });

        it('should create a session without optional patientId', async () => {
            const session = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            expect(session.id).toBeDefined();
            expect(session.patientId).toBeUndefined();
        });

        it('should generate unique IDs for multiple sessions', async () => {
            const session1 = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            const session2 = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['knee'],
            });

            expect(session1.id).not.toBe(session2.id);
        });
    });

    describe('getById()', () => {
        it('should retrieve an existing session', async () => {
            const created = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            const retrieved = await repo.getById(created.id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
            expect(retrieved?.organizationId).toBe('org-001');
        });

        it('should return undefined for non-existent session', async () => {
            const result = await repo.getById('non-existent-id');
            expect(result).toBeUndefined();
        });
    });

    describe('listByOrg()', () => {
        it('should return all sessions for an organization', async () => {
            await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-002',
                joints: ['knee'],
            });

            await repo.create({
                organizationId: 'org-002',
                clinicianId: 'clinician-003',
                joints: ['hip'],
            });

            const org001Sessions = await repo.listByOrg('org-001');
            const org002Sessions = await repo.listByOrg('org-002');

            expect(org001Sessions).toHaveLength(2);
            expect(org002Sessions).toHaveLength(1);
            expect(org001Sessions.every(s => s.organizationId === 'org-001')).toBe(true);
        });

        it('should return empty array for organization with no sessions', async () => {
            const sessions = await repo.listByOrg('org-999');
            expect(sessions).toEqual([]);
        });
    });

    describe('updateStatus()', () => {
        it('should update session status', async () => {
            const session = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            const updated = await repo.updateStatus(session.id, 'in_progress');

            expect(updated).toBeDefined();
            expect(updated?.status).toBe('in_progress');
            expect(updated?.updatedAt).not.toBe(session.updatedAt);
        });

        it('should return undefined for non-existent session', async () => {
            const result = await repo.updateStatus('non-existent-id', 'completed');
            expect(result).toBeUndefined();
        });

        it('should support all valid status transitions', async () => {
            const session = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            const statuses = ['in_progress', 'completed', 'cancelled'];

            for (const status of statuses) {
                const updated = await repo.updateStatus(session.id, status);
                expect(updated?.status).toBe(status);
            }
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent creates without race conditions', async () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                repo.create({
                    organizationId: 'org-001',
                    clinicianId: `clinician-${i}`,
                    joints: ['shoulder'],
                })
            );

            const sessions = await Promise.all(promises);

            // All should have unique IDs
            const ids = sessions.map(s => s.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(10);
        });

        it('should handle concurrent updates to different sessions', async () => {
            const session1 = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder'],
            });

            const session2 = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-002',
                joints: ['knee'],
            });

            const [updated1, updated2] = await Promise.all([
                repo.updateStatus(session1.id, 'in_progress'),
                repo.updateStatus(session2.id, 'completed'),
            ]);

            expect(updated1?.status).toBe('in_progress');
            expect(updated2?.status).toBe('completed');
        });
    });

    describe('Data Persistence', () => {
        it('should persist data across multiple reads', async () => {
            const created = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                joints: ['shoulder', 'knee'],
            });

            // Read multiple times
            const read1 = await repo.getById(created.id);
            const read2 = await repo.getById(created.id);
            const read3 = await repo.getById(created.id);

            expect(read1).toEqual(read2);
            expect(read2).toEqual(read3);
        });

        it('should maintain data integrity after updates', async () => {
            const session = await repo.create({
                organizationId: 'org-001',
                clinicianId: 'clinician-001',
                patientId: 'patient-001',
                joints: ['shoulder'],
            });

            await repo.updateStatus(session.id, 'completed');

            const retrieved = await repo.getById(session.id);

            expect(retrieved?.status).toBe('completed');
            expect(retrieved?.organizationId).toBe('org-001');
            expect(retrieved?.patientId).toBe('patient-001');
            expect(retrieved?.joints).toEqual(['shoulder']);
        });
    });
});
