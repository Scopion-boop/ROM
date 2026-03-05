/**
 * Integration tests for Drizzle ClinicInviteRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleClinicInviteRepo } from '../clinic-invite-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_CLINICIAN_ID,
} from './test-setup';

describe('DrizzleClinicInviteRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleClinicInviteRepo();

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    describe('create()', () => {
        it('should create an invite with all fields', async () => {
            const invite = await repo.create({
                token: 'invite-token-001',
                organizationId: TEST_ORG_ID,
                invitedEmail: 'invited@clinic.example',
                invitedByUserId: TEST_CLINICIAN_ID,
                role: 'clinician',
                expiresAt: futureDate,
            });

            expect(invite.id).toBeDefined();
            expect(invite.token).toBe('invite-token-001');
            expect(invite.organizationId).toBe(TEST_ORG_ID);
            expect(invite.invitedEmail).toBe('invited@clinic.example');
            expect(invite.invitedByUserId).toBe(TEST_CLINICIAN_ID);
            expect(invite.role).toBe('clinician');
            expect(invite.expiresAt).toBeDefined();
            expect(invite.acceptedAt).toBeUndefined();
            expect(invite.createdAt).toBeDefined();
        });

        it('should create an invite with clinic_admin role', async () => {
            const invite = await repo.create({
                token: 'invite-admin-001',
                organizationId: TEST_ORG_ID,
                invitedEmail: 'admin@clinic.example',
                invitedByUserId: TEST_CLINICIAN_ID,
                role: 'clinic_admin',
                expiresAt: futureDate,
            });

            expect(invite.role).toBe('clinic_admin');
        });

        it('should reject duplicate tokens', async () => {
            await repo.create({
                token: 'dup-token',
                organizationId: TEST_ORG_ID,
                invitedEmail: 'first@clinic.example',
                invitedByUserId: TEST_CLINICIAN_ID,
                role: 'clinician',
                expiresAt: futureDate,
            });

            await expect(
                repo.create({
                    token: 'dup-token',
                    organizationId: TEST_ORG_ID,
                    invitedEmail: 'second@clinic.example',
                    invitedByUserId: TEST_CLINICIAN_ID,
                    role: 'clinician',
                    expiresAt: futureDate,
                }),
            ).rejects.toThrow();
        });
    });

    describe('getByToken()', () => {
        it('should retrieve an invite by token', async () => {
            await repo.create({
                token: 'find-token-001',
                organizationId: TEST_ORG_ID,
                invitedEmail: 'findme@clinic.example',
                invitedByUserId: TEST_CLINICIAN_ID,
                role: 'clinician',
                expiresAt: futureDate,
            });

            const found = await repo.getByToken('find-token-001');

            expect(found).toBeDefined();
            expect(found?.token).toBe('find-token-001');
            expect(found?.invitedEmail).toBe('findme@clinic.example');
        });

        it('should return undefined for non-existent token', async () => {
            const result = await repo.getByToken('nonexistent-token');
            expect(result).toBeUndefined();
        });
    });

    describe('markAccepted()', () => {
        it('should set acceptedAt timestamp on an invite', async () => {
            await repo.create({
                token: 'accept-token-001',
                organizationId: TEST_ORG_ID,
                invitedEmail: 'acceptme@clinic.example',
                invitedByUserId: TEST_CLINICIAN_ID,
                role: 'clinician',
                expiresAt: futureDate,
            });

            const before = await repo.getByToken('accept-token-001');
            expect(before?.acceptedAt).toBeUndefined();

            await repo.markAccepted('accept-token-001');

            const after = await repo.getByToken('accept-token-001');
            expect(after?.acceptedAt).toBeDefined();
        });

        it('should be idempotent (marking accepted twice does not throw)', async () => {
            await repo.create({
                token: 'idem-token',
                organizationId: TEST_ORG_ID,
                invitedEmail: 'idem@clinic.example',
                invitedByUserId: TEST_CLINICIAN_ID,
                role: 'clinician',
                expiresAt: futureDate,
            });

            await repo.markAccepted('idem-token');
            await repo.markAccepted('idem-token');

            const invite = await repo.getByToken('idem-token');
            expect(invite?.acceptedAt).toBeDefined();
        });
    });
});
