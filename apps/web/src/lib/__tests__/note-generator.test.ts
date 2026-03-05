import { describe, it, expect } from 'vitest';
import { generateNote, generateSimplifiedText, noteToPlainText } from '../note-generator';
import type { EnrichedMeasurement } from '../rom-utils';

/**
 * Helper to create an EnrichedMeasurement with defaults.
 */
function makeEnriched(overrides: Partial<EnrichedMeasurement> = {}): EnrichedMeasurement {
    return {
        joint: 'shoulder',
        movement: 'flexion',
        side: 'right',
        romDegrees: 150,
        confidence: 0.95,
        timestamp: Date.now(),
        normalRomDegrees: 180,
        percentOfNormal: 83,
        deficitDegrees: 30,
        withinNormal: false,
        status: 'mild',
        suspectAccuracy: false,
        ...overrides,
    };
}

describe('note-generator', () => {
    // ── generateNote ──────────────────────────────────────────────

    describe('generateNote', () => {
        it('produces a GeneratedNote with required fields', () => {
            const measurements = [makeEnriched()];
            const note = generateNote(measurements);

            expect(note.sections).toBeDefined();
            expect(Array.isArray(note.sections)).toBe(true);
            expect(note.generatedAt).toBeDefined();
            expect(note.measurementCount).toBe(1);
            expect(note.jointsCovered).toContain('Shoulder');
            expect(note.simplifiedText).toBeDefined();
        });

        it('includes header, summary, interpretation, recommendations, and disclaimer sections', () => {
            const note = generateNote([makeEnriched()]);
            const types = note.sections.map((s) => s.type);

            expect(types).toContain('header');
            expect(types).toContain('summary');
            expect(types).toContain('interpretation');
            expect(types).toContain('recommendations');
            expect(types).toContain('disclaimer');
        });

        it('includes a joint_group section per distinct joint', () => {
            const measurements = [
                makeEnriched({ joint: 'shoulder' }),
                makeEnriched({ joint: 'knee', movement: 'flexion', romDegrees: 130, normalRomDegrees: 140, percentOfNormal: 93, status: 'normal' }),
            ];
            const note = generateNote(measurements);
            const jointGroups = note.sections.filter((s) => s.type === 'joint_group');

            expect(jointGroups.length).toBe(2);
        });

        it('counts deficits correctly', () => {
            const measurements = [
                makeEnriched({ status: 'mild' }),
                makeEnriched({ joint: 'knee', movement: 'flexion', status: 'normal' }),
                makeEnriched({ joint: 'knee', movement: 'extension', status: 'severe', romDegrees: 10, normalRomDegrees: 30, percentOfNormal: 33 }),
            ];
            const note = generateNote(measurements);

            // mild + severe = 2 deficits, normal is not counted
            expect(note.deficitCount).toBe(2);
        });

        it('includes gaps section when low confidence measurements exist', () => {
            const measurements = [makeEnriched({ confidence: 0.3 })];
            const note = generateNote(measurements);
            const gapsSection = note.sections.find((s) => s.type === 'gaps');

            expect(gapsSection).toBeDefined();
            expect(gapsSection!.content).toContain('low confidence');
        });

        it('includes gaps section when selected joints are missing from captures', () => {
            const measurements = [makeEnriched({ joint: 'shoulder' })];
            const note = generateNote(measurements, undefined, ['shoulder', 'knee']);
            const gapsSection = note.sections.find((s) => s.type === 'gaps');

            expect(gapsSection).toBeDefined();
            expect(gapsSection!.content).toContain('Knee');
            expect(gapsSection!.content).toContain('not captured');
        });

        it('includes patient context in the header when provided', () => {
            const note = generateNote(
                [makeEnriched()],
                { name: 'John Doe', provider: 'Dr. Smith' },
            );
            const header = note.sections.find((s) => s.type === 'header');

            expect(header).toBeDefined();
            expect(header!.content).toContain('John Doe');
            expect(header!.content).toContain('Dr. Smith');
        });

        it('handles empty measurements gracefully', () => {
            const note = generateNote([]);
            expect(note.measurementCount).toBe(0);
            expect(note.deficitCount).toBe(0);
            expect(note.jointsCovered).toEqual([]);
        });
    });

    // ── generateSimplifiedText ────────────────────────────────────

    describe('generateSimplifiedText', () => {
        it('groups by side + joint and lists movements', () => {
            const measurements = [
                makeEnriched({ side: 'right', joint: 'shoulder', movement: 'flexion', romDegrees: 150 }),
                makeEnriched({ side: 'right', joint: 'shoulder', movement: 'extension', romDegrees: 45 }),
            ];
            const text = generateSimplifiedText(measurements);

            expect(text).toContain('Right Shoulder');
            expect(text).toContain('Flexion 150°');
            expect(text).toContain('Extension 45°');
        });

        it('returns empty string for empty measurements', () => {
            expect(generateSimplifiedText([])).toBe('');
        });
    });

    // ── noteToPlainText ───────────────────────────────────────────

    describe('noteToPlainText', () => {
        it('converts a GeneratedNote to formatted plain text', () => {
            const note = generateNote([makeEnriched()]);
            const text = noteToPlainText(note);

            expect(typeof text).toBe('string');
            expect(text).toContain('ROM EXAMINATION REPORT');
            expect(text).toContain('SUMMARY OF FINDINGS');
            expect(text).toContain('DISCLAIMER');
        });

        it('includes each section title in uppercase', () => {
            const note = generateNote([makeEnriched()]);
            const text = noteToPlainText(note);

            for (const section of note.sections) {
                expect(text).toContain(section.title.toUpperCase());
            }
        });
    });
});
