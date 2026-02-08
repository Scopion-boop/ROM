'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraSetupWizard from '@/components/capture/CameraSetupWizard';
import type { CapturedMeasurement } from '@rom/shared-types';
import MeasurementPanel from '@/components/capture/MeasurementPanel';
import NoteEditor from '@/components/notes/NoteEditor';
import { ArrowRight, Camera, ClipboardList, FileText } from 'lucide-react';

type SessionPhase = 'setup' | 'results' | 'note';

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
    const [capturedMeasurements, setCapturedMeasurements] = useState<CapturedMeasurement[]>([]);

    const panelMeasurements = capturedMeasurements.map((m) => ({
        joint: m.joint,
        movement: m.movement,
        side: m.side,
        romDegrees: m.romDegrees,
        confidenceScore: m.confidence,
        qualityFlags: [] as { code: string; message: string; severity: string }[],
    }));

    const placeholderBlocks = [
        { id: '1', type: 'header', content: `ROM Examination — ${capturedMeasurements.length} measurement(s)` },
        { id: '2', type: 'free_text', content: '' },
    ];

    const handleWizardComplete = (measurements: CapturedMeasurement[]) => {
        setCapturedMeasurements(measurements);
        setPhase('results');
    };

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
                        <MeasurementPanel measurements={panelMeasurements} />
                        <div style={{ marginTop: 24 }}>
                            <button
                                className="btn-primary btn-lg"
                                onClick={() => setPhase('note')}
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
                        <NoteEditor
                            blocks={placeholderBlocks}
                            onSave={(updatedBlocks: { id: string; type: string; content: string }[]) => {
                                console.log('Save:', updatedBlocks);
                            }}
                            onFinalize={() => {
                                console.log('Finalized');
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
