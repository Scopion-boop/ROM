/**
 * note-generator.ts — Transform enriched measurements into a clinical note.
 *
 * Takes an array of EnrichedMeasurement and produces:
 *   1. A header section with exam metadata
 *   2. Gaps section highlighting unassessed joints or suspect data
 *   3. Per-joint measurement tables with normative comparison
 *   4. A summary of deficits found
 *   5. Placeholder for clinical interpretation (filled by LLM later)
 */

import type { EnrichedMeasurement } from './rom-utils';
import { getNormativeRange } from '@physiolens/shared-types';

// ─── Types ─────────────────────────────────────────────────────────

export interface NoteSection {
  id: string;
  type:
    | 'header'
    | 'gaps'
    | 'joint_group'
    | 'summary'
    | 'interpretation'
    | 'recommendations'
    | 'disclaimer';
  title: string;
  content: string;
  measurements?: EnrichedMeasurement[];
}

export interface GeneratedNote {
  sections: NoteSection[];
  generatedAt: string;
  measurementCount: number;
  deficitCount: number;
  jointsCovered: string[];
  /** Simplified copy-paste text grouped by joint */
  simplifiedText: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function formatJoint(j: string) {
  return j
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatMovement(m: string) {
  return m
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'normal':
      return '✓';
    case 'mild':
      return '↓';
    case 'moderate':
      return '↓↓';
    case 'severe':
      return '↓↓↓';
    default:
      return '—';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'normal':
      return 'Within Normal Limits';
    case 'mild':
      return 'Mild Deficit';
    case 'moderate':
      return 'Moderate Deficit';
    case 'severe':
      return 'Severe Deficit';
    default:
      return 'No Reference';
  }
}

// ─── Section builders ──────────────────────────────────────────────

function buildHeaderSection(
  idx: number,
  count: number,
  ctx?: { name?: string; dob?: string; provider?: string },
): NoteSection {
  const patientLine = ctx?.name ? `Patient: ${ctx.name}` : 'Patient: [Not specified]';
  const providerLine = ctx?.provider ? `Provider: ${ctx.provider}` : '';
  const dateLine = `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

  return {
    id: `section-${idx}`,
    type: 'header',
    title: 'ROM Examination Report',
    content: [patientLine, providerLine, dateLine, `Measurements: ${count}`]
      .filter(Boolean)
      .join('\n'),
  };
}

function buildGapsSection(
  idx: number,
  measurements: EnrichedMeasurement[],
  selectedJoints?: string[],
): NoteSection | null {
  const lines: string[] = [];

  // Flag joints that were selected but have no measurements
  if (selectedJoints && selectedJoints.length > 0) {
    const capturedJoints = new Set<string>(measurements.map((m) => m.joint));
    const missing = selectedJoints.filter((j) => !capturedJoints.has(j));
    if (missing.length > 0) {
      lines.push('Joints not assessed:');
      for (const j of missing) {
        lines.push(`  - ${formatJoint(j)} — not captured`);
      }
    }
  }

  // Flag measurements with low confidence or suspect accuracy
  const lowConfidence = measurements.filter((m) => m.confidence < 0.7);
  const suspect = measurements.filter((m) => m.suspectAccuracy);

  if (lowConfidence.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Inadequate data (low confidence):');
    for (const m of lowConfidence) {
      lines.push(
        `  - ${formatJoint(m.joint)} ${formatMovement(m.movement)} (${m.side}) — confidence ${Math.round(m.confidence * 100)}%, consider re-capture`,
      );
    }
  }

  if (suspect.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Suspect accuracy (exceeds physiological range):');
    for (const m of suspect) {
      lines.push(
        `  - ${formatJoint(m.joint)} ${formatMovement(m.movement)} (${m.side}) — ${m.romDegrees}° (${m.percentOfNormal}% of normal), likely tracking error`,
      );
    }
  }

  if (lines.length === 0) return null;

  return {
    id: `section-${idx}`,
    type: 'gaps',
    title: 'Data Quality Flags',
    content: lines.join('\n'),
  };
}

function formatMeasurementRow(m: EnrichedMeasurement): string {
  const mov = formatMovement(m.movement).padEnd(18);
  const side = m.side.padEnd(8);
  const rom = `${m.romDegrees}°`.padStart(5);
  const normal = m.normalRomDegrees === null ? '  —  ' : `${m.normalRomDegrees}°`.padStart(7);
  const pct = m.percentOfNormal === null ? '  —  ' : `${m.percentOfNormal}%`.padStart(7);
  const status = `${statusEmoji(m.status)} ${statusLabel(m.status)}`;
  return `${mov} | ${side} | ${rom} | ${normal} | ${pct} | ${status}`;
}

function buildJointGroupSection(
  idx: number,
  joint: string,
  jointMeasurements: EnrichedMeasurement[],
): NoteSection {
  const lines = [
    'Movement          | Side    | ROM°  | Normal° | %Normal | Status',
    '─────────────────────────────────────────────────────────────────',
    ...jointMeasurements.map(formatMeasurementRow),
  ];

  const deficits = jointMeasurements.filter((m) => m.status !== 'normal' && m.status !== 'unknown');
  if (deficits.length > 0) {
    lines.push('', `⚠ ${deficits.length} deficit(s) identified in ${formatJoint(joint)}`);
  }

  return {
    id: `section-${idx}`,
    type: 'joint_group',
    title: formatJoint(joint),
    content: lines.join('\n'),
    measurements: jointMeasurements,
  };
}

function buildSummaryContent(measurements: Readonly<EnrichedMeasurement[]>): string {
  const totalDeficits = measurements.filter((m) => m.status !== 'normal' && m.status !== 'unknown');
  const severeDeficits = measurements.filter((m) => m.status === 'severe');
  const normalCount = measurements.filter((m) => m.status === 'normal').length;

  const lines: string[] = [
    `Total movements assessed: ${measurements.length}`,
    `Within normal limits: ${normalCount}`,
    `Deficits identified: ${totalDeficits.length}`,
  ];

  if (severeDeficits.length > 0) {
    lines.push(
      `Severe deficits: ${severeDeficits.length}`,
      ...severeDeficits.map(
        (s) =>
          `  • ${formatJoint(s.joint)} ${formatMovement(s.movement)} (${s.side}): ${s.romDegrees}° / ${s.normalRomDegrees ?? '?'}° normal — ${s.percentOfNormal ?? '?'}%`,
      ),
    );
  }

  return lines.join('\n');
}

// ─── Simplified Text Generator ────────────────────────────────────

/**
 * Generate a simplified copy-paste text format:
 *
 * Left Shoulder
 * - Flexion 155°
 * - Extension 40°
 *
 * Right Knee
 * - Flexion 130°
 */
export function generateSimplifiedText(measurements: EnrichedMeasurement[]): string {
  // Group by (side + joint)
  const groups = new Map<string, EnrichedMeasurement[]>();
  for (const m of measurements) {
    const key = `${m.side}:${m.joint}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const blocks: string[] = [];
  for (const [, groupMeasurements] of groups) {
    const first = groupMeasurements[0]!;
    const side =
      first.side === 'midline'
        ? ''
        : `${first.side.charAt(0).toUpperCase() + first.side.slice(1)} `;
    const header = `${side}${formatJoint(first.joint)}`;
    const lines = groupMeasurements.map((m) => {
      const range = getNormativeRange(m.joint, m.movement);
      const normalSuffix = range ? ` (normal: ${range.minDegrees}-${range.maxDegrees}\u00B0)` : '';
      return `- ${formatMovement(m.movement)} ${m.romDegrees}\u00B0${normalSuffix}`;
    });
    blocks.push(`${header}\n${lines.join('\n')}`);
  }

  return blocks.join('\n\n');
}

// ─── Generator ─────────────────────────────────────────────────────

export function generateNote(
  measurements: EnrichedMeasurement[],
  patientContext?: { name?: string; dob?: string; provider?: string },
  selectedJoints?: string[],
): GeneratedNote {
  const now = new Date().toISOString();
  let sectionIdx = 0;

  const sections: NoteSection[] = [
    buildHeaderSection(sectionIdx++, measurements.length, patientContext),
  ];

  // Gaps section (if any quality issues found)
  const gapsSection = buildGapsSection(sectionIdx, measurements, selectedJoints);
  if (gapsSection) {
    sectionIdx++;
    sections.push(gapsSection);
  }

  // Group by joint
  const byJoint = new Map<string, EnrichedMeasurement[]>();
  for (const m of measurements) {
    const key = m.joint;
    if (!byJoint.has(key)) byJoint.set(key, []);
    byJoint.get(key)!.push(m);
  }

  for (const [joint, jointMeasurements] of byJoint) {
    sections.push(buildJointGroupSection(sectionIdx++, joint, jointMeasurements));
  }

  const totalDeficits = measurements.filter((m) => m.status !== 'normal' && m.status !== 'unknown');

  sections.push(
    {
      id: `section-${sectionIdx++}`,
      type: 'summary',
      title: 'Summary of Findings',
      content: buildSummaryContent(measurements),
    },
    {
      id: `section-${sectionIdx++}`,
      type: 'interpretation',
      title: 'Clinical Interpretation',
      content: '[Click "Generate AI Interpretation" to analyse these results]',
    },
    {
      id: `section-${sectionIdx++}`,
      type: 'recommendations',
      title: 'Recommended Clinical Tests',
      content: '[Will be populated based on AI analysis of measurement patterns]',
    },
    {
      id: `section-${sectionIdx++}`,
      type: 'disclaimer',
      title: 'Disclaimer',
      content:
        'This report is generated using computer vision-assisted ROM measurement. All measurements should be verified by a qualified healthcare provider. AI-generated interpretations are provided as clinical decision support and do not constitute medical advice. Final clinical decisions remain the responsibility of the treating clinician.',
    },
  );

  return {
    sections,
    generatedAt: now,
    measurementCount: measurements.length,
    deficitCount: totalDeficits.length,
    jointsCovered: [...byJoint.keys()].map(formatJoint),
    simplifiedText: generateSimplifiedText(measurements),
  };
}

/**
 * Convert a GeneratedNote to plain text suitable for clipboard paste into EMR.
 */
export function noteToPlainText(note: GeneratedNote): string {
  return note.sections
    .map((section) => `═══ ${section.title.toUpperCase()} ═══\n${section.content}\n`)
    .join('\n');
}
