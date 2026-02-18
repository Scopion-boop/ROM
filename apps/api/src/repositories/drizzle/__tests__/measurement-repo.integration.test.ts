/**
 * Integration tests for Drizzle MeasurementRepo.
 *
 * Prerequisites:
 * - TEST_DATABASE_URL must be set
 * - PostgreSQL test database must be running
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createDrizzleMeasurementRepo } from '../measurement-repo';
import { createDrizzleSessionRepo } from '../session-repo';
import {
    setupIntegrationTestHooks,
    TEST_ORG_ID,
    TEST_CLINICIAN_ID,
} from './test-setup';

describe('DrizzleMeasurementRepo Integration Tests', () => {
    setupIntegrationTestHooks();

    const measurementRepo = createDrizzleMeasurementRepo();
    const sessionRepo = createDrizzleSessionRepo();

    let testSessionId: string;

    beforeEach(async () => {
        // Create a test session for measurements
        const session = await sessionRepo.create({
            organizationId: TEST_ORG_ID,
            clinicianId: TEST_CLINICIAN_ID,
            joints: ['shoulder'],
        });
        testSessionId = session.id;
    });

    describe('create()', () => {
        it('should create a measurement with all fields', async () => {
            const measurement = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            expect(measurement.id).toBeDefined();
            expect(measurement.sessionId).toBe(testSessionId);
            expect(measurement.joint).toBe('shoulder');
            expect(measurement.movement).toBe('flexion');
            expect(measurement.side).toBe('right');
            expect(measurement.romDegrees).toBe(165.5);
            expect(measurement.confidenceScore).toBe(0.92);
            expect(measurement.qualityFlags).toEqual([]);
            expect(measurement.algorithmVersion).toBe('v1.0');
            expect(measurement.captureDurationMs).toBe(5000);
            expect(measurement.createdAt).toBeDefined();
        });

        it('should handle measurements with empty quality flags', async () => {
            const measurement = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'knee',
                movement: 'extension',
                side: 'left',
                romDegrees: 140.0,
                confidenceScore: 0.85,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 3000,
            });

            expect(measurement.qualityFlags).toEqual([]);
        });

        it('should generate unique IDs for multiple measurements', async () => {
            const m1 = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            const m2 = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'abduction',
                side: 'right',
                romDegrees: 170.0,
                confidenceScore: 0.88,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5500,
            });

            expect(m1.id).not.toBe(m2.id);
        });
    });

    describe('getById()', () => {
        it('should retrieve an existing measurement', async () => {
            const created = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            const retrieved = await measurementRepo.getById(created.id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
            expect(retrieved?.romDegrees).toBe(165.5);
        });

        it('should return undefined for non-existent measurement', async () => {
            const result = await measurementRepo.getById('00000000-0000-0000-0000-000000000999');
            expect(result).toBeUndefined();
        });
    });

    describe('listBySession()', () => {
        it('should return all measurements for a session', async () => {
            await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'abduction',
                side: 'right',
                romDegrees: 170.0,
                confidenceScore: 0.88,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5500,
            });

            // Create measurement for different session
            const session2 = await sessionRepo.create({
                organizationId: TEST_ORG_ID,
                clinicianId: TEST_CLINICIAN_ID,
                joints: ['knee'],
            });

            await measurementRepo.create({
                sessionId: session2.id,
                joint: 'knee',
                movement: 'flexion',
                side: 'left',
                romDegrees: 120.0,
                confidenceScore: 0.90,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 4000,
            });

            const session1Measurements = await measurementRepo.listBySession(testSessionId);
            const session2Measurements = await measurementRepo.listBySession(session2.id);

            expect(session1Measurements).toHaveLength(2);
            expect(session2Measurements).toHaveLength(1);
            expect(session1Measurements.every(m => m.sessionId === testSessionId)).toBe(true);
        });

        it('should return empty array for session with no measurements', async () => {
            const measurements = await measurementRepo.listBySession('00000000-0000-0000-0000-000000000999');
            expect(measurements).toEqual([]);
        });

        it('should maintain order of measurements', async () => {
            const m1 = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));

            const m2 = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'abduction',
                side: 'right',
                romDegrees: 170.0,
                confidenceScore: 0.88,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5500,
            });

            const measurements = await measurementRepo.listBySession(testSessionId);

            expect(measurements[0]?.id).toBe(m1.id);
            expect(measurements[1]?.id).toBe(m2.id);
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent measurement creates', async () => {
            const promises = Array.from({ length: 20 }, (_, i) =>
                measurementRepo.create({
                    sessionId: testSessionId,
                    joint: 'shoulder',
                    movement: 'flexion',
                    side: 'right',
                    romDegrees: 160 + i,
                    confidenceScore: 0.9,
                    qualityFlags: [],
                    algorithmVersion: 'v1.0',
                    captureDurationMs: 5000,
                })
            );

            const measurements = await Promise.all(promises);

            // All should have unique IDs
            const ids = measurements.map(m => m.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(20);

            // All should be retrievable
            const retrieved = await measurementRepo.listBySession(testSessionId);
            expect(retrieved).toHaveLength(20);
        });
    });

    describe('Data Precision', () => {
        it('should preserve decimal precision for ROM degrees', async () => {
            const testValues = [165.5, 170.25, 140.75, 180.0, 90.33333];

            for (const degrees of testValues) {
                const measurement = await measurementRepo.create({
                    sessionId: testSessionId,
                    joint: 'shoulder',
                    movement: 'flexion',
                    side: 'right',
                    romDegrees: degrees,
                    confidenceScore: 0.92,
                    qualityFlags: [],
                    algorithmVersion: 'v1.0',
                    captureDurationMs: 5000,
                });

                expect(measurement.romDegrees).toBe(degrees);

                const retrieved = await measurementRepo.getById(measurement.id);
                expect(retrieved?.romDegrees).toBe(degrees);
            }
        });

        it('should preserve confidence score precision', async () => {
            const measurement = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92345,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            expect(measurement.confidenceScore).toBeCloseTo(0.92345, 5);
        });
    });

    describe('Quality Flags Array Handling', () => {
        it('should handle empty quality flags array', async () => {
            const measurement = await measurementRepo.create({
                sessionId: testSessionId,
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 165.5,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 5000,
            });

            expect(measurement.qualityFlags).toEqual([]);

            const retrieved = await measurementRepo.getById(measurement.id);
            expect(retrieved?.qualityFlags).toEqual([]);
        });
    });
});
