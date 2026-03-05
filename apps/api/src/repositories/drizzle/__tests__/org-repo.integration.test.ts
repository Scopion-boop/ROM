/**
 * Integration tests for Drizzle OrgRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleOrgRepo } from '../org-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
} from './test-setup';

describe('DrizzleOrgRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleOrgRepo();

    describe('create()', () => {
        it('should create an organization with name only', async () => {
            const org = await repo.create({ name: 'New Clinic' });

            expect(org.id).toBeDefined();
            expect(org.name).toBe('New Clinic');
            expect(org.billingEmail).toBeUndefined();
            expect(org.monthlySessionCount).toBe(0);
            expect(org.createdAt).toBeDefined();
            expect(org.updatedAt).toBeDefined();
        });

        it('should create an organization with billingEmail', async () => {
            const org = await repo.create({
                name: 'Billing Clinic',
                billingEmail: 'billing@clinic.example',
            });

            expect(org.name).toBe('Billing Clinic');
            expect(org.billingEmail).toBe('billing@clinic.example');
        });

        it('should generate unique IDs', async () => {
            const org1 = await repo.create({ name: 'Org A' });
            const org2 = await repo.create({ name: 'Org B' });
            expect(org1.id).not.toBe(org2.id);
        });
    });

    describe('getById()', () => {
        it('should retrieve a seeded organization', async () => {
            const org = await repo.getById(TEST_ORG_ID);

            expect(org).toBeDefined();
            expect(org?.id).toBe(TEST_ORG_ID);
            expect(org?.name).toBe('Test Organization 1');
        });

        it('should return undefined for non-existent org', async () => {
            const result = await repo.getById('00000000-0000-0000-0000-000000000999');
            expect(result).toBeUndefined();
        });
    });

    describe('updateStripeCustomerId()', () => {
        it('should set the stripe customer ID on an org', async () => {
            await repo.updateStripeCustomerId(TEST_ORG_ID, 'cus_test_12345');

            const org = await repo.getById(TEST_ORG_ID);
            expect(org?.stripeCustomerId).toBe('cus_test_12345');
        });

        it('should overwrite an existing stripe customer ID', async () => {
            await repo.updateStripeCustomerId(TEST_ORG_ID, 'cus_old');
            await repo.updateStripeCustomerId(TEST_ORG_ID, 'cus_new');

            const org = await repo.getById(TEST_ORG_ID);
            expect(org?.stripeCustomerId).toBe('cus_new');
        });
    });

    describe('incrementSessionCount()', () => {
        it('should increment monthly session count by 1', async () => {
            const before = await repo.getById(TEST_ORG_ID);
            expect(before?.monthlySessionCount).toBe(0);

            await repo.incrementSessionCount(TEST_ORG_ID);
            await repo.incrementSessionCount(TEST_ORG_ID);

            const after = await repo.getById(TEST_ORG_ID);
            expect(after?.monthlySessionCount).toBe(2);
        });
    });

    describe('resetSessionCount()', () => {
        it('should reset monthly session count to 0', async () => {
            await repo.incrementSessionCount(TEST_ORG_ID);
            await repo.incrementSessionCount(TEST_ORG_ID);
            await repo.incrementSessionCount(TEST_ORG_ID);

            const before = await repo.getById(TEST_ORG_ID);
            expect(before?.monthlySessionCount).toBe(3);

            await repo.resetSessionCount(TEST_ORG_ID);

            const after = await repo.getById(TEST_ORG_ID);
            expect(after?.monthlySessionCount).toBe(0);
        });
    });
});
