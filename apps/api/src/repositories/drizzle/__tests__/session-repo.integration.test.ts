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
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_ORG_2_ID,
    TEST_CLINICIAN_ID,
    TEST_CLINICIAN_2_ID,
    TEST_CLINICIAN_3_ID,
} from './test-setup';

describe('DrizzleSessionRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleSessionRepo();

    describe('create()', () => {
        it('should create a session with all fields', async () => {
            const session = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                patientId: 'patient-001',
                joints: ['shoulder', 'knee'],
            });

            expect(session.id).toBeDefined();
            expect(session.organizationId).toBe(TEST_ORG_ID);
            expect(session.clinicianId).toBe(TEST_CLINICIAN_ID);
            expect(session.patientId).toBe('patient-001');
            expect(session.joints).toEqual(['shoulder', 'knee']);
            expect(session.status).toBe('created');
            expect(session.createdAt).toBeDefined();
            expect(session.updatedAt).toBeDefined();
        });

        it('should create a session without optional patientId', async () => {
            const session = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            expect(session.id).toBeDefined();
            expect(session.patientId).toBeUndefined();
        });

        it('should generate unique IDs for multiple sessions', async () => {
            const session1 = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            const session2 = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['knee'],
            });

            expect(session1.id).not.toBe(session2.id);
        });
    });

    describe('getById()', () => {
        it('should retrieve an existing session', async () => {
            const created = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            const retrieved = await repo.getById(created.id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
            expect(retrieved?.organizationId).toBe(TEST_ORG_ID);
        });

        it('should return undefined for non-existent session', async () => {
            const result = await repo.getById('00000000-0000-0000-0000-000000000999');
            expect(result).toBeUndefined();
        });
    });

    describe('listByOrg()', () => {
        it('should return all sessions for an organization', async () => {
            await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_2_ID,
                joints: ['knee'],
            });

            await repo.create({
                organizationId: TEST_ORG_2_ID,
                clinicianId: TEST_CLINICIAN_3_ID,
                joints: ['hip'],
            });

            const org1Sessions = await repo.listByOrg(TEST_ORG_ID);
            const org2Sessions = await repo.listByOrg(TEST_ORG_2_ID);

            expect(org1Sessions).toHaveLength(2);
            expect(org2Sessions).toHaveLength(1);
            expect(org1Sessions.every(s => s.organizationId === TEST_ORG_ID)).toBe(true);
        });

        it('should return empty array for organization with no sessions', async () => {
            const sessions = await repo.listByOrg('00000000-0000-0000-0000-000000000999');
            expect(sessions).toEqual([]);
        });
    });

    describe('updateStatus()', () => {
        it('should update session status', async () => {
            const session = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            const updated = await repo.updateStatus(session.id, 'capture_in_progress');

            expect(updated).toBeDefined();
            expect(updated?.status).toBe('capture_in_progress');
            expect(updated?.updatedAt).not.toBe(session.updatedAt);
        });

        it('should return undefined for non-existent session', async () => {
            const result = await repo.updateStatus('00000000-0000-0000-0000-000000000999', 'finalized');
            expect(result).toBeUndefined();
        });

        it('should support all valid status transitions', async () => {
            const session = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            const statuses = ['capture_in_progress', 'capture_complete', 'review', 'finalized', 'exported', 'archived'];

            for (const status of statuses) {
                const updated = await repo.updateStatus(session.id, status);
                expect(updated?.status).toBe(status);
            }
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent creates without race conditions', async () => {
            const promises = Array.from({ length: 10 }, () =>
                repo.create({
                    organizationId: TEST_ORG_ID,
                    clinicianId: TEST_CLINICIAN_ID,
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
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['shoulder'],
            });

            const session2 = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_2_ID,
                joints: ['knee'],
            });

            const [updated1, updated2] = await Promise.all([
                repo.updateStatus(session1.id, 'capture_in_progress'),
                repo.updateStatus(session2.id, 'finalized'),
            ]);

            expect(updated1?.status).toBe('capture_in_progress');
            expect(updated2?.status).toBe('finalized');
        });
    });

    describe('Data Persistence', () => {
        it('should persist data across multiple reads', async () => {
            const created = await repo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
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
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                patientId: 'patient-001',
                joints: ['shoulder'],
            });

            await repo.updateStatus(session.id, 'finalized');

            const retrieved = await repo.getById(session.id);

            expect(retrieved?.status).toBe('finalized');
            expect(retrieved?.organizationId).toBe(TEST_ORG_ID);
            expect(retrieved?.patientId).toBe('patient-001');
            expect(retrieved?.joints).toEqual(['shoulder']);
        });
    });
});
