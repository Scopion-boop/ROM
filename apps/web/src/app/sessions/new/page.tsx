'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraSetupWizard from '@/components/capture/CameraSetupWizard';
import type { CapturedMeasurement } from '@rom/shared-types';
import MeasurementPanel from '@/components/capture/MeasurementPanel';
import NoteRenderer from '@/components/notes/NoteRenderer';
import { ArrowRight, Camera, ClipboardList, FileText } from 'lucide-react';
import { processCaptures, type EnrichedMeasurement } from '@/lib/rom-utils';
import { generateNote, type GeneratedNote, type NoteSection } from '@/lib/note-generator';

type SessionPhase = 'setup' | 'results' | 'note';

interface LlmRecommendation {
    name: string;
    purpose: string;
    rationale: string;
    priority: string;
}

interface JointTestGroup {
    joint: string;
    tests: { name: string; purpose: string; indication: string; evidence?: string }[];
}

function formatRecommendation(r: LlmRecommendation, idx: number): string {
    return `${idx + 1}. ${r.name} [${r.priority.toUpperCase()}]\n   Purpose: ${r.purpose}\n   Rationale: ${r.rationale}`;
}

function formatTestEvidence(t: { name: string; purpose: string; evidence?: string }): string {
    const suffix = t.evidence ? ` (${t.evidence})` : '';
    return `  • ${t.name}: ${t.purpose}${suffix}`;
}

function formatTestGroup(jt: JointTestGroup): string {
    const header = `\n── ${jt.joint.charAt(0).toUpperCase() + jt.joint.slice(1)} Special Tests ──`;
    const tests = jt.tests.map((t) => formatTestEvidence(t)).join('\n');
    return `${header}\n${tests}`;
}

interface InterpretationPayload {
    interpretation: string;
    recommendations: LlmRecommendation[];
    clinicalTests: JointTestGroup[];
}

function applyInterpretation(section: NoteSection, payload: InterpretationPayload): NoteSection {
    if (section.type === 'interpretation') {
        return { ...section, content: payload.interpretation };
    }
    if (section.type === 'recommendations') {
        const recLines = payload.recommendations.map((r, i) => formatRecommendation(r, i)).join('\n\n');
        const testLines = payload.clinicalTests.map((g) => formatTestGroup(g)).join('\n');
        return { ...section, content: `${recLines}\n${testLines}` };
    }
    return section;
}

function applyInterpretationError(section: NoteSection, message: string): NoteSection {
    if (section.type === 'interpretation') {
        return { ...section, content: `[Error: ${message}. Check console for details.]` };
    }
    return section;
}

const STEPS = [
    { key: 'setup', label: 'Capture', icon: Camera },
    { key: 'results', label: 'Results', icon: ClipboardList },
    { key: 'note', label: 'Clinical Note', icon: FileText },
] as const;

const pageVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
};

export default function NewSessionPage() {
    const [phase, setPhase] = useState<SessionPhase>('setup');
    const [enrichedMeasurements, setEnrichedMeasurements] = useState<EnrichedMeasurement[]>([]);
    const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null);
    const [isInterpreting, setIsInterpreting] = useState(false);

    const handleWizardComplete = (measurements: CapturedMeasurement[]) => {
        setEnrichedMeasurements(processCaptures(measurements));
        setPhase('results');
    };

    const handleProceedToNote = () => {
        setGeneratedNote(generateNote(enrichedMeasurements));
        setPhase('note');
    };

    const handleRequestInterpretation = useCallback(async () => {
        if (enrichedMeasurements.length === 0 || !generatedNote) return;
        setIsInterpreting(true);

        try {
            const res = await fetch('/api/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ measurements: enrichedMeasurements }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? `API error ${res.status}`);
            }

            const data = await res.json() as InterpretationPayload;

            // Update interpretation and recommendations sections
            setGeneratedNote((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sections: prev.sections.map((s) => applyInterpretation(s, data)),
                };
            });
        } catch (err) {
            console.error('Interpretation failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to generate interpretation';
            setGeneratedNote((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    sections: prev.sections.map((s) => applyInterpretationError(s, msg)),
                };
            });
        } finally {
            setIsInterpreting(false);
        }
    }, [enrichedMeasurements, generatedNote]);

    const currentStep = STEPS.findIndex((s) => s.key === phase);

    return (
        <main data-testid="new-session-page" style={{ maxWidth: 960, margin: '0 auto' }}>
            {/* ── Progress Stepper ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 32,
                    paddingBottom: 24,
                    borderBottom: '1px solid var(--border-primary)',
                }}
            >
                {STEPS.map((s, i) => {
                    const isActive = i === currentStep;
                    const isDone = i < currentStep;

                    function stepBg() {
                        if (isActive) return 'var(--accent-glow)';
                        if (isDone) return 'rgba(20,184,166,0.06)';
                        return 'transparent';
                    }

                    function stepColor() {
                        if (isActive) return 'var(--text-primary)';
                        if (isDone) return 'var(--accent)';
                        return 'var(--text-muted)';
                    }

                    return (
                        <React.Fragment key={s.key}>
                            {i > 0 && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: 2,
                                        borderRadius: 999,
                                        background: isDone ? 'var(--accent)' : 'var(--border-primary)',
                                        transition: 'background 0.4s ease',
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 16px',
                                    borderRadius: 999,
                                    background: stepBg(),
                                    border: `1px solid ${isActive ? 'var(--border-accent)' : 'transparent'}`,
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                <s.icon
                                    size={16}
                                    style={{ color: isActive || isDone ? 'var(--accent)' : 'var(--text-muted)' }}
                                />
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 400,
                                        color: stepColor(),
                                    }}
                                >
                                    {s.label}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* ── Phase Content ── */}
            <AnimatePresence mode="wait">
                {phase === 'setup' && (
                    <motion.div
                        key="setup"
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>
                            New Examination Session
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', marginBottom: 24, fontSize: 15 }}>
                            Select joints, position camera, and capture measurements.
                        </p>
                        <CameraSetupWizard onComplete={handleWizardComplete} />
                    </motion.div>
                )}

                {phase === 'results' && (
                    <motion.div
                        key="results"
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>
                            Measurement Results
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', marginBottom: 24, fontSize: 15 }}>
                            Review captured ROM data before generating the clinical note.
                        </p>
                        <MeasurementPanel measurements={enrichedMeasurements} />
                        <div style={{ marginTop: 24 }}>
                            <button
                                className="btn-primary btn-lg"
                                onClick={handleProceedToNote}
                                data-testid="btn-proceed-note"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                Proceed to Note <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 'note' && (
                    <motion.div
                        key="note"
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>
                            Clinical Note
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', marginBottom: 24, fontSize: 15 }}>
                            Edit, save, or finalize the auto-generated clinical note.
                        </p>
                        {generatedNote && (
                            <NoteRenderer
                                note={generatedNote}
                                onRequestInterpretation={handleRequestInterpretation}
                                isInterpreting={isInterpreting}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
