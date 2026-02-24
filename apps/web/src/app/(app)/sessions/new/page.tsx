'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraSetupWizard from '@/components/capture/CameraSetupWizard';
import { CaptureErrorBoundary } from '@/components/capture/CaptureErrorBoundary';
import type { CapturedMeasurement } from '@physiolens/shared-types';
import NoteRenderer from '@/components/notes/NoteRenderer';
import { Camera, FileText, Save, CheckCircle2 } from 'lucide-react';
import { processCaptures, type EnrichedMeasurement } from '@/lib/rom-utils';
import { generateNote, type GeneratedNote } from '@/lib/note-generator';

type SessionPhase = 'setup' | 'note';

const STEPS = [
    { key: 'setup', label: 'Capture', icon: Camera },
    { key: 'note', label: 'Clinical Note', icon: FileText },
] as const;

const pageVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
};

export default function NewSessionPage() {
    const [phase, setPhase] = useState<SessionPhase>('setup');
    const [generatedNote, setGeneratedNote] = useState<GeneratedNote | null>(null);
    const [enrichedMeasurements, setEnrichedMeasurements] = useState<EnrichedMeasurement[]>([]);
    const [sessionDurationMin, setSessionDurationMin] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const sessionStartRef = useRef(Date.now());

    const handleWizardComplete = (measurements: CapturedMeasurement[]) => {
        const enriched = processCaptures(measurements);
        setEnrichedMeasurements(enriched);
        const durationMin = Math.round((Date.now() - sessionStartRef.current) / 60000);
        setSessionDurationMin(durationMin);
        setGeneratedNote(generateNote(enriched));
        setPhase('note');
    };

    const handleSave = async () => {
        const name = window.prompt('Enter a name for this session:', 'Session ' + new Date().toLocaleDateString());
        if (!name) return;
        setSaving(true);
        try {
            const joints = [...new Set(enrichedMeasurements.map(m => m.joint))];
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ joints, patientId: name }),
            });
            if (res.status === 402) {
                alert('Free plan limited to 100 saved sessions. Upgrade to save more.');
                return;
            }
            if (!res.ok) throw new Error('Failed to create session');
            const session = await res.json();

            // Save each measurement
            for (const m of enrichedMeasurements) {
                await fetch(`/api/sessions/${session.id}/measurements`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        joint: m.joint,
                        movement: m.movement,
                        side: m.side,
                        romDegrees: m.romDegrees,
                        confidenceScore: m.confidence ?? 0,
                        qualityFlags: [],
                        algorithmVersion: 'v1.0',
                        captureDurationMs: 0,
                    }),
                });
            }
            setSaved(true);
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save session. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const currentStep = STEPS.findIndex((s) => s.key === phase);

    return (
        <main data-testid="new-session-page" style={{ maxWidth: 960, margin: '0 auto' }}>
            {/* -- Progress Stepper -- */}
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
                        if (isDone) return 'rgba(14,205,186,0.06)';
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

            {/* -- Phase Content -- */}
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
                        <CaptureErrorBoundary onReset={() => setPhase('setup')}>
                            <CameraSetupWizard onComplete={handleWizardComplete} />
                        </CaptureErrorBoundary>
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
                        {sessionDurationMin !== null && (
                            <p style={{ color: 'var(--accent)', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                                Note ready. Your session took {sessionDurationMin} minute{sessionDurationMin === 1 ? '' : 's'} — {Math.max(0, 20 - sessionDurationMin)} minutes saved vs manual documentation.
                            </p>
                        )}
                        <p style={{ color: 'var(--text-tertiary)', marginBottom: 24, fontSize: 15 }}>
                            Copy the note below into your EMR.
                        </p>
                        {generatedNote && (
                            <NoteRenderer note={generatedNote} />
                        )}
                        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || saved}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '12px 24px',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    opacity: saved ? 0.6 : 1,
                                }}
                            >
                                {saved ? (
                                    <><CheckCircle2 size={16} /> Saved</>
                                ) : saving ? (
                                    <>Saving...</>
                                ) : (
                                    <><Save size={16} /> Save Session</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
