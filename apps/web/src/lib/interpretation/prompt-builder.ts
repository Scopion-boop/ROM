/**
 * prompt-builder.ts — Build user-prompt from enriched measurements.
 */

import type { EnrichedMeasurement } from '@/lib/rom-utils';

function formatJoint(j: string) {
    return j.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatMovement(m: string) {
    return m.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Builds a structured user-message for the LLM containing all measurement data.
 */
export function buildUserPrompt(measurements: Readonly<EnrichedMeasurement[]>): string {
    const byJoint = new Map<string, EnrichedMeasurement[]>();
    for (const m of measurements) {
        const key = m.joint;
        if (!byJoint.has(key)) byJoint.set(key, []);
        byJoint.get(key)!.push(m);
    }

    const sections: string[] = [];

    for (const [joint, jointMeasurements] of byJoint) {
        const rows = jointMeasurements.map((m) => ({
            movement: formatMovement(m.movement),
            side: m.side,
            measured_degrees: m.romDegrees,
            normal_degrees: m.normalRomDegrees,
            percent_of_normal: m.percentOfNormal,
            deficit_severity: m.status,
        }));

        sections.push(`## ${formatJoint(joint)}
${JSON.stringify(rows, null, 2)}`);
    }

    return `Please interpret the following ROM examination data and recommend appropriate clinical special tests.

${sections.join('\n\n')}

Total measurements: ${measurements.length}
Joints assessed: ${[...byJoint.keys()].map(formatJoint).join(', ')}`;
}
