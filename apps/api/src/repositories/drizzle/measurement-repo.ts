import { eq } from 'drizzle-orm';
import { getDb, measurements } from '../../db';
import type { MeasurementRepo, MeasurementRecord } from '../interfaces';

function rowToRecord(row: typeof measurements.$inferSelect): MeasurementRecord {
    return {
        id: row.id,
        sessionId: row.sessionId,
        joint: row.joint,
        movement: row.movement,
        side: row.side,
        romDegrees: row.romDegrees,
        confidenceScore: row.confidenceScore,
        qualityFlags: row.qualityFlags,
        algorithmVersion: row.algorithmVersion,
        captureDurationMs: row.captureDurationMs,
        createdAt: row.createdAt.toISOString(),
    };
}

export function createDrizzleMeasurementRepo(): MeasurementRepo {
    return {
        async create(data) {
            const db = getDb();
            const rows = await db
                .insert(measurements)
                .values({
                    sessionId: data.sessionId,
                    joint: data.joint,
                    movement: data.movement,
                    side: data.side,
                    romDegrees: data.romDegrees,
                    confidenceScore: data.confidenceScore,
                    qualityFlags: data.qualityFlags,
                    algorithmVersion: data.algorithmVersion,
                    captureDurationMs: data.captureDurationMs,
                })
                .returning();
            return rowToRecord(rows[0]!);
        },

        async getById(id) {
            const db = getDb();
            const rows = await db.select().from(measurements).where(eq(measurements.id, id));
            return rows[0] ? rowToRecord(rows[0]) : undefined;
        },

        async listBySession(sessionId) {
            const db = getDb();
            const rows = await db
                .select()
                .from(measurements)
                .where(eq(measurements.sessionId, sessionId));
            return rows.map(rowToRecord);
        },

        async _clear() {
            const db = getDb();
            await db.delete(measurements);
        },
    };
}
