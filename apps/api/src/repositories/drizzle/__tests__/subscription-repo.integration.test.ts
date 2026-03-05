/**
 * Integration tests for Drizzle SubscriptionRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleSubscriptionRepo } from '../subscription-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_ORG_2_ID,
} from './test-setup';

describe('DrizzleSubscriptionRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleSubscriptionRepo();

    const baseSub = {
        organizationId: TEST_ORG_ID,
        stripeCustomerId: 'cus_test_001',
        stripeSubscriptionId: 'sub_test_001',
        stripePriceId: 'price_test_001',
        plan: 'solo' as const,
        status: 'active' as const,
        cancelAtPeriodEnd: false,
    };

    describe('create()', () => {
        it('should create a subscription with all fields', async () => {
            const sub = await repo.create(baseSub);

            expect(sub.id).toBeDefined();
            expect(sub.organizationId).toBe(TEST_ORG_ID);
            expect(sub.stripeCustomerId).toBe('cus_test_001');
            expect(sub.stripeSubscriptionId).toBe('sub_test_001');
            expect(sub.plan).toBe('solo');
            expect(sub.status).toBe('active');
            expect(sub.cancelAtPeriodEnd).toBe(false);
            expect(sub.createdAt).toBeDefined();
            expect(sub.updatedAt).toBeDefined();
        });

        it('should create a trialing subscription', async () => {
            const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
            const sub = await repo.create({
                ...baseSub,
                status: 'trialing',
                trialEndsAt: trialEnd,
            });

            expect(sub.status).toBe('trialing');
            expect(sub.trialEndsAt).toBeDefined();
        });
    });

    describe('getActiveByOrgId()', () => {
        it('should return an active subscription', async () => {
            await repo.create(baseSub);

            const active = await repo.getActiveByOrgId(TEST_ORG_ID);

            expect(active).toBeDefined();
            expect(active?.organizationId).toBe(TEST_ORG_ID);
            expect(active?.status).toBe('active');
        });

        it('should return a trialing subscription', async () => {
            await repo.create({ ...baseSub, status: 'trialing' });

            const active = await repo.getActiveByOrgId(TEST_ORG_ID);

            expect(active).toBeDefined();
            expect(active?.status).toBe('trialing');
        });

        it('should return undefined when only canceled subscriptions exist', async () => {
            await repo.create({ ...baseSub, status: 'canceled' });

            const active = await repo.getActiveByOrgId(TEST_ORG_ID);
            expect(active).toBeUndefined();
        });

        it('should return undefined for org with no subscriptions', async () => {
            const active = await repo.getActiveByOrgId(TEST_ORG_2_ID);
            expect(active).toBeUndefined();
        });
    });

    describe('upsertByOrgId()', () => {
        it('should insert when no subscription exists', async () => {
            const sub = await repo.upsertByOrgId(TEST_ORG_ID, {
                stripeCustomerId: 'cus_upsert',
                plan: 'solo',
                status: 'active',
            });

            expect(sub.id).toBeDefined();
            expect(sub.organizationId).toBe(TEST_ORG_ID);
            expect(sub.stripeCustomerId).toBe('cus_upsert');
        });

        it('should update when a subscription already exists', async () => {
            await repo.create(baseSub);

            const updated = await repo.upsertByOrgId(TEST_ORG_ID, {
                status: 'past_due',
                cancelAtPeriodEnd: true,
            });

            expect(updated.organizationId).toBe(TEST_ORG_ID);
            expect(updated.status).toBe('past_due');
            expect(updated.cancelAtPeriodEnd).toBe(true);
        });

        it('should preserve existing fields on partial update', async () => {
            await repo.create(baseSub);

            const updated = await repo.upsertByOrgId(TEST_ORG_ID, {
                status: 'past_due',
            });

            // stripeCustomerId should be unchanged
            expect(updated.stripeCustomerId).toBe('cus_test_001');
        });
    });
});
