/**
 * Integration tests for Drizzle UserRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleUserRepo } from '../user-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_ORG_2_ID,
    TEST_CLINICIAN_ID,
} from './test-setup';

describe('DrizzleUserRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleUserRepo();

    describe('create()', () => {
        it('should create a user with required fields', async () => {
            const user = await repo.create({
                email: 'newuser@test.example',
                passwordHash: 'hashed-password-1',
                organizationId: TEST_ORG_ID,
                role: 'clinician',
            });

            expect(user.id).toBeDefined();
            expect(user.email).toBe('newuser@test.example');
            expect(user.passwordHash).toBe('hashed-password-1');
            expect(user.organizationId).toBe(TEST_ORG_ID);
            expect(user.role).toBe('clinician');
            expect(user.onboardingCompleted).toBe(false);
        });

        it('should create a user with optional displayName', async () => {
            const user = await repo.create({
                email: 'named@test.example',
                passwordHash: 'hashed-password-2',
                organizationId: TEST_ORG_ID,
                role: 'clinic_admin',
                displayName: 'Dr. Smith',
            });

            expect(user.displayName).toBe('Dr. Smith');
            expect(user.role).toBe('clinic_admin');
        });

        it('should reject duplicate email addresses', async () => {
            await repo.create({
                email: 'dup@test.example',
                passwordHash: 'hash-a',
                organizationId: TEST_ORG_ID,
                role: 'clinician',
            });

            await expect(
                repo.create({
                    email: 'dup@test.example',
                    passwordHash: 'hash-b',
                    organizationId: TEST_ORG_ID,
                    role: 'clinician',
                }),
            ).rejects.toThrow();
        });
    });

    describe('getByEmail()', () => {
        it('should retrieve a user by email', async () => {
            // Seeded user from test-setup
            const user = await repo.getByEmail('clinician1@test.example');

            expect(user).toBeDefined();
            expect(user?.id).toBe(TEST_CLINICIAN_ID);
            expect(user?.email).toBe('clinician1@test.example');
        });

        it('should return undefined for non-existent email', async () => {
            const result = await repo.getByEmail('nobody@test.example');
            expect(result).toBeUndefined();
        });
    });

    describe('listByOrg()', () => {
        it('should return all users for an organization', async () => {
            const org1Users = await repo.listByOrg(TEST_ORG_ID);
            const org2Users = await repo.listByOrg(TEST_ORG_2_ID);

            // test-setup seeds 2 clinicians in org1, 1 in org2
            expect(org1Users).toHaveLength(2);
            expect(org2Users).toHaveLength(1);
            expect(org1Users.every((u) => u.organizationId === TEST_ORG_ID)).toBe(true);
        });

        it('should return empty array for org with no users', async () => {
            const users = await repo.listByOrg('00000000-0000-0000-0000-000000000999');
            expect(users).toEqual([]);
        });
    });

    describe('update()', () => {
        it('should update displayName', async () => {
            const updated = await repo.update(TEST_CLINICIAN_ID, {
                displayName: 'Dr. Updated',
            });

            expect(updated).toBeDefined();
            expect(updated?.displayName).toBe('Dr. Updated');
        });

        it('should update onboardingCompleted', async () => {
            const updated = await repo.update(TEST_CLINICIAN_ID, {
                onboardingCompleted: true,
            });

            expect(updated).toBeDefined();
            expect(updated?.onboardingCompleted).toBe(true);
        });

        it('should update country and specialty', async () => {
            const updated = await repo.update(TEST_CLINICIAN_ID, {
                country: 'AU',
                specialty: 'Physiotherapy',
            });

            expect(updated).toBeDefined();
            expect(updated?.country).toBe('AU');
            expect(updated?.specialty).toBe('Physiotherapy');
        });

        it('should return undefined for non-existent user', async () => {
            const result = await repo.update('00000000-0000-0000-0000-000000000999', {
                displayName: 'Ghost',
            });
            expect(result).toBeUndefined();
        });
    });
});
