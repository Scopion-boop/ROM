/**
 * Integration tests for Drizzle StripeEventRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleStripeEventRepo } from '../stripe-event-repo';
import { setupIntegrationTestHooks } from './test-setup';

describe('DrizzleStripeEventRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const repo = createDrizzleStripeEventRepo();

    describe('record()', () => {
        it('should record a stripe event', async () => {
            const event = await repo.record({
                stripeEventId: 'evt_test_001',
                type: 'checkout.session.completed',
            });

            expect(event.id).toBeDefined();
            expect(event.stripeEventId).toBe('evt_test_001');
            expect(event.type).toBe('checkout.session.completed');
            expect(event.processedAt).toBeDefined();
        });

        it('should reject duplicate stripe event IDs', async () => {
            await repo.record({
                stripeEventId: 'evt_dup_001',
                type: 'invoice.paid',
            });

            await expect(
                repo.record({
                    stripeEventId: 'evt_dup_001',
                    type: 'invoice.paid',
                }),
            ).rejects.toThrow();
        });

        it('should record events with different types', async () => {
            const event1 = await repo.record({
                stripeEventId: 'evt_type_1',
                type: 'customer.subscription.created',
            });

            const event2 = await repo.record({
                stripeEventId: 'evt_type_2',
                type: 'customer.subscription.deleted',
            });

            expect(event1.type).toBe('customer.subscription.created');
            expect(event2.type).toBe('customer.subscription.deleted');
        });
    });

    describe('getByStripeEventId()', () => {
        it('should retrieve a recorded event by stripe event ID', async () => {
            const recorded = await repo.record({
                stripeEventId: 'evt_find_001',
                type: 'payment_intent.succeeded',
            });

            const found = await repo.getByStripeEventId('evt_find_001');

            expect(found).toBeDefined();
            expect(found?.id).toBe(recorded.id);
            expect(found?.stripeEventId).toBe('evt_find_001');
            expect(found?.type).toBe('payment_intent.succeeded');
        });

        it('should return undefined for non-existent event ID', async () => {
            const result = await repo.getByStripeEventId('evt_nonexistent');
            expect(result).toBeUndefined();
        });
    });
});
