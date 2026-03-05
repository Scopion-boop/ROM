/**
 * Integration tests for Drizzle PatientLinkRepo.
 *
 * PatientLinks have a FK to sessions, so tests create a session first.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createDrizzlePatientLinkRepo } from '../patient-link-repo';
import { createDrizzleSessionRepo } from '../session-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_CLINICIAN_ID,
} from './test-setup';

describe('DrizzlePatientLinkRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzlePatientLinkRepo();
    const sessionRepo = createDrizzleSessionRepo();
    let sessionId: string;

    beforeEach(async () => {
        const session = await sessionRepo.create({
            organizationId: TEST_ORG_ID,
            clinicianId: TEST_CLINICIAN_ID,
            joints: ['shoulder', 'knee'],
        });
        sessionId = session.id;
    });

    describe('create()', () => {
        it('should create a patient link with a generated token', async () => {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const link = await repo.create({
                sessionId,
                organizationId: TEST_ORG_ID,
                joints: ['shoulder'],
                expiresAt,
            });

            expect(link.id).toBeDefined();
            expect(link.token).toBeDefined();
            expect(link.token.length).toBeGreaterThan(0);
            expect(link.sessionId).toBe(sessionId);
            expect(link.organizationId).toBe(TEST_ORG_ID);
            expect(link.joints).toEqual(['shoulder']);
            expect(link.expiresAt).toBeDefined();
            expect(link.usedAt).toBeUndefined();
            expect(link.createdAt).toBeDefined();
        });

        it('should generate unique tokens for different links', async () => {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const link1 = await repo.create({
                sessionId,
                organizationId: TEST_ORG_ID,
                joints: ['shoulder'],
                expiresAt,
            });

            const link2 = await repo.create({
                sessionId,
                organizationId: TEST_ORG_ID,
                joints: ['knee'],
                expiresAt,
            });

            expect(link1.token).not.toBe(link2.token);
        });
    });

    describe('getByToken()', () => {
        it('should retrieve a link by its token', async () => {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const created = await repo.create({
                sessionId,
                organizationId: TEST_ORG_ID,
                joints: ['shoulder'],
                expiresAt,
            });

            const retrieved = await repo.getByToken(created.token);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
            expect(retrieved?.token).toBe(created.token);
            expect(retrieved?.sessionId).toBe(sessionId);
        });

        it('should return undefined for non-existent token', async () => {
            const result = await repo.getByToken('non-existent-token');
            expect(result).toBeUndefined();
        });
    });

    describe('markUsed()', () => {
        it('should set usedAt timestamp on an existing link', async () => {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const created = await repo.create({
                sessionId,
                organizationId: TEST_ORG_ID,
                joints: ['shoulder'],
                expiresAt,
            });

            expect(created.usedAt).toBeUndefined();

            await repo.markUsed(created.token);

            const updated = await repo.getByToken(created.token);
            expect(updated?.usedAt).toBeDefined();
        });

        it('should be idempotent (marking used twice does not throw)', async () => {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const created = await repo.create({
                sessionId,
                organizationId: TEST_ORG_ID,
                joints: ['shoulder'],
                expiresAt,
            });

            await repo.markUsed(created.token);
            await repo.markUsed(created.token);

            const updated = await repo.getByToken(created.token);
            expect(updated?.usedAt).toBeDefined();
        });
    });
});
