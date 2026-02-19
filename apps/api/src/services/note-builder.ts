import { randomUUID } from 'node:crypto';
import type { JointType, MovementType, BodySide, NoteStatus } from '@physiolens/shared-types';

export interface NoteBlock {
    id: string;
    type: 'header' | 'measurement_summary' | 'quality_note' | 'free_text';
    content: string;
}

/** V1 note status aligns with @physiolens/shared-types NoteStatus. */
export type GeneratedNoteStatus = NoteStatus;

export interface GeneratedNote {
    id: string;
    sessionId: string;
    status: GeneratedNoteStatus;
    blocks: NoteBlock[];
    createdAt: string;
    updatedAt: string;
}

export interface MeasurementInput {
    joint: JointType;
    movement: MovementType;
    side: BodySide;
    romDegrees: number;
    confidenceScore: number;
    qualityFlags: { code: string; message: string; severity: string }[];
}

/**
 * Generate a deterministic clinical exam note from measurements.
 * V1 produces structured blocks that clinicians can edit before finalizing.
 *
 * This is a *pure* function — storage is handled by NoteRepo via the factory.
 */
export function generateNote(sessionId: string, measurements: MeasurementInput[]): GeneratedNote {
    const now = new Date().toISOString();
    const blocks: NoteBlock[] = [];

    // Header block
    blocks.push({
        id: randomUUID(),
        type: 'header',
        content: `ROM Examination — ${measurements.length} measurement(s) recorded`,
    });

    // Per-measurement summary blocks
    for (const m of measurements) {
        const label = `${m.side.charAt(0).toUpperCase() + m.side.slice(1)} ${m.joint} — ${m.movement}`;
        const confidence = Math.round(m.confidenceScore * 100);
        blocks.push({
            id: randomUUID(),
            type: 'measurement_summary',
            content: `${label}: ${m.romDegrees}° (confidence ${confidence}%)`,
        });

        // Quality flag warnings
        for (const flag of m.qualityFlags) {
            if (flag.severity === 'warning' || flag.severity === 'error') {
                blocks.push({
                    id: randomUUID(),
                    type: 'quality_note',
                    content: `⚠ ${flag.code}: ${flag.message}`,
                });
            }
        }
    }

    // Free-text block for clinician notes
    blocks.push({
        id: randomUUID(),
        type: 'free_text',
        content: '',
    });

    return {
        id: randomUUID(),
        sessionId,
        status: 'draft',
        blocks,
        createdAt: now,
        updatedAt: now,
    };
}
