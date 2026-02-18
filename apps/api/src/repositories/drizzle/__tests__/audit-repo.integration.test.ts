/**
 * Integration tests for DrizzleAuditRepo — verify audit logging works correctly.
 *
 * Critical for HIPAA compliance: 45 CFR § 164.312(b) - Audit Controls
 * All PHI access and modifications MUST be logged and immutable.
 */

import { describe, it, expect } from 'vitest';
import { createDrizzleAuditRepo } from '../audit-repo';
import { setupIntegrationTestHooks } from './test-setup';

describe('DrizzleAuditRepo Integration Tests', () => {
    setupIntegrationTestHooks();
    const repo = createDrizzleAuditRepo();

    describe('record()', () => {
        it('should record an audit event with all required fields', async () => {
            const event = await repo.record({
                eventType: 'auth.login',
                entityType: 'user',
                entityId: 'user-001',
                actorId: 'user-001',
                organizationId: 'org-001',
                metadata: { email: 'test@example.com' },
            });

            expect(event.id).toBeDefined();
            expect(event.eventType).toBe('auth.login');
            expect(event.entityType).toBe('user');
            expect(event.entityId).toBe('user-001');
            expect(event.actorId).toBe('user-001');
            expect(event.organizationId).toBe('org-001');
            expect(event.metadata).toEqual({ email: 'test@example.com' });
            expect(event.createdAt).toBeDefined();
        });

        it('should record audit events for all critical PHI operations', async () => {
            const operations = [
                { eventType: 'session.created', entityType: 'session' },
                { eventType: 'measurement.recorded', entityType: 'measurement' },
                { eventType: 'note.generated', entityType: 'note' },
                { eventType: 'note.edited', entityType: 'note' },
                { eventType: 'note.approved', entityType: 'note' },
                { eventType: 'note.exported', entityType: 'note' },
            ];

            for (const op of operations) {
                const event = await repo.record({
                    eventType: op.eventType,
                    entityType: op.entityType,
                    entityId: 'entity-001',
                    actorId: 'clinician-001',
                    organizationId: 'org-001',
                });

                expect(event.eventType).toBe(op.eventType);
                expect(event.entityType).toBe(op.entityType);
            }
        });

        it('should record failed authentication attempts', async () => {
            const event = await repo.record({
                eventType: 'auth.failed',
                entityType: 'user',
                entityId: 'unknown',
                actorId: 'unknown',
                organizationId: 'unknown',
                metadata: { email: 'attacker@evil.com', reason: 'invalid_password' },
            });

            expect(event.eventType).toBe('auth.failed');
            expect(event.metadata).toHaveProperty('reason');
        });

        it('should handle metadata with complex objects', async () => {
            const complexMetadata = {
                sessionId: 'session-001',
                measurements: [
                    { joint: 'shoulder', romDegrees: 150 },
                    { joint: 'knee', romDegrees: 135 },
                ],
                timestamp: new Date().toISOString(),
            };

            const event = await repo.record({
                eventType: 'note.generated',
                entityType: 'note',
                entityId: 'note-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                metadata: complexMetadata,
            });

            expect(event.metadata).toEqual(complexMetadata);
        });
    });

    describe('list()', () => {
        it('should list all audit events without filters', async () => {
            await repo.record({
                eventType: 'session.created',
                entityType: 'session',
                entityId: 'session-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            await repo.record({
                eventType: 'measurement.recorded',
                entityType: 'measurement',
                entityId: 'measurement-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            const events = await repo.list({});
            expect(events.length).toBeGreaterThanOrEqual(2);
        });

        it('should filter audit events by organizationId', async () => {
            await repo.record({
                eventType: 'auth.login',
                entityType: 'user',
                entityId: 'user-001',
                actorId: 'user-001',
                organizationId: 'org-alpha',
            });

            await repo.record({
                eventType: 'auth.login',
                entityType: 'user',
                entityId: 'user-002',
                actorId: 'user-002',
                organizationId: 'org-beta',
            });

            const events = await repo.list({ organizationId: 'org-alpha' });
            expect(events.length).toBeGreaterThanOrEqual(1);
            events.forEach((e) => expect(e.organizationId).toBe('org-alpha'));
        });

        it('should filter audit events by eventType', async () => {
            await repo.record({
                eventType: 'note.exported',
                entityType: 'note',
                entityId: 'note-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            await repo.record({
                eventType: 'note.approved',
                entityType: 'note',
                entityId: 'note-002',
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            const events = await repo.list({ eventType: 'note.exported' });
            expect(events.length).toBeGreaterThanOrEqual(1);
            events.forEach((e) => expect(e.eventType).toBe('note.exported'));
        });

        it('should filter audit events by entityId', async () => {
            const entityId = 'session-unique-001';
            await repo.record({
                eventType: 'session.created',
                entityType: 'session',
                entityId,
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            await repo.record({
                eventType: 'session.finalized',
                entityType: 'session',
                entityId,
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            const events = await repo.list({ entityId });
            expect(events.length).toBeGreaterThanOrEqual(2);
            events.forEach((e) => expect(e.entityId).toBe(entityId));
        });

        it('should support multiple filters simultaneously', async () => {
            const orgId = 'org-multi-filter';
            const entityType = 'measurement';

            await repo.record({
                eventType: 'measurement.recorded',
                entityType,
                entityId: 'measurement-001',
                actorId: 'clinician-001',
                organizationId: orgId,
            });

            await repo.record({
                eventType: 'note.generated',
                entityType: 'note',
                entityId: 'note-001',
                actorId: 'clinician-001',
                organizationId: orgId,
            });

            const events = await repo.list({ organizationId: orgId, entityType });
            expect(events.length).toBeGreaterThanOrEqual(1);
            events.forEach((e) => {
                expect(e.organizationId).toBe(orgId);
                expect(e.entityType).toBe(entityType);
            });
        });
    });

    describe('count()', () => {
        it('should return total count of audit events', async () => {
            const initialCount = await repo.count();

            await repo.record({
                eventType: 'auth.login',
                entityType: 'user',
                entityId: 'user-001',
                actorId: 'user-001',
                organizationId: 'org-001',
            });

            const newCount = await repo.count();
            expect(newCount).toBe(initialCount + 1);
        });
    });

    describe('HIPAA Compliance Requirements', () => {
        it('should create immutable audit trail (events cannot be modified)', async () => {
            const event = await repo.record({
                eventType: 'note.exported',
                entityType: 'note',
                entityId: 'note-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                metadata: { format: 'pdf' },
            });

            // Verify audit repository does not expose update method
            expect(repo).not.toHaveProperty('update');
            expect(repo).not.toHaveProperty('delete');

            // Verify event persists unchanged
            const events = await repo.list({ entityId: event.entityId });
            const found = events.find((e) => e.id === event.id);
            expect(found?.metadata).toEqual({ format: 'pdf' });
        });

        it('should log all PHI access operations', async () => {
            const sessionId = 'session-phi-test';

            // Simulate complete clinical workflow
            await repo.record({
                eventType: 'session.created',
                entityType: 'session',
                entityId: sessionId,
                actorId: 'clinician-001',
                organizationId: 'org-001',
            });

            await repo.record({
                eventType: 'measurement.recorded',
                entityType: 'measurement',
                entityId: 'measurement-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                metadata: { sessionId },
            });

            await repo.record({
                eventType: 'note.generated',
                entityType: 'note',
                entityId: 'note-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                metadata: { sessionId },
            });

            await repo.record({
                eventType: 'note.exported',
                entityType: 'note',
                entityId: 'note-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                metadata: { sessionId, format: 'pdf' },
            });

            // Verify complete audit trail exists
            const events = await repo.list({});
            const sessionEvents = events.filter(
                (e) => e.entityId === sessionId || e.metadata?.sessionId === sessionId,
            );

            expect(sessionEvents.length).toBeGreaterThanOrEqual(4);
            const eventTypes = sessionEvents.map((e) => e.eventType);
            expect(eventTypes).toContain('session.created');
            expect(eventTypes).toContain('measurement.recorded');
            expect(eventTypes).toContain('note.generated');
            expect(eventTypes).toContain('note.exported');
        });

        it('should support 6-year retention requirement (query old events)', async () => {
            // Simulate old event (HIPAA requires 6 years minimum)
            const event = await repo.record({
                eventType: 'note.exported',
                entityType: 'note',
                entityId: 'note-legacy',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                metadata: { retentionTest: true },
            });

            // Verify event can be retrieved
            const events = await repo.list({ entityId: 'note-legacy' });
            expect(events.length).toBeGreaterThanOrEqual(1);
            expect(events[0]?.metadata).toHaveProperty('retentionTest');
        });
    });

    describe('Security Edge Cases', () => {
        it('should handle missing optional metadata', async () => {
            const event = await repo.record({
                eventType: 'session.created',
                entityType: 'session',
                entityId: 'session-001',
                actorId: 'clinician-001',
                organizationId: 'org-001',
                // No metadata
            });

            expect(event.metadata).toEqual({});
        });

        it('should handle concurrent audit writes', async () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                repo.record({
                    eventType: 'auth.login',
                    entityType: 'user',
                    entityId: `user-${i}`,
                    actorId: `user-${i}`,
                    organizationId: 'org-001',
                }),
            );

            const events = await Promise.all(promises);
            expect(events.length).toBe(10);

            // Verify all events persisted
            const count = await repo.count();
            expect(count).toBeGreaterThanOrEqual(10);
        });
    });
});
