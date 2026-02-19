'use client';

import React, { useCallback, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    Brain,
    CheckCircle2,
    Clipboard,
    ClipboardCheck,
    Download,
    FileText,
    ListChecks,
    Shield,
    Sparkles,
    Stethoscope,
} from 'lucide-react';
import type { GeneratedNote, NoteSection } from '@/lib/note-generator';
import { noteToPlainText } from '@/lib/note-generator';
import type { EnrichedMeasurement } from '@/lib/rom-utils';

// ─── Status colours (matching MeasurementPanel) ────────────────────

// 4-colour clinical data system
const STATUS_COLORS: Record<string, { bg: string; text: string; track: string }> = {
    normal: { bg: 'rgba(74,222,128,0.08)', text: 'rgba(74,222,128,0.8)', track: 'rgba(74,222,128,0.8)' },
    mild: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', track: '#F59E0B' },
    moderate: { bg: 'rgba(248,113,113,0.08)', text: '#F87171', track: '#F87171' },
    severe: { bg: 'rgba(248,113,113,0.08)', text: '#F87171', track: '#F87171' },
    unknown: { bg: 'rgba(75,85,99,0.08)', text: '#4B5563', track: '#4B5563' },
};

// ─── Section icon resolver ─────────────────────────────────────────

function sectionIcon(type: NoteSection['type']) {
    switch (type) {
        case 'header': return <FileText size={16} style={{ color: 'var(--accent)' }} />;
        case 'joint_group': return <Activity size={16} style={{ color: 'var(--accent)' }} />;
        case 'summary': return <ListChecks size={16} style={{ color: 'var(--accent)' }} />;
        case 'interpretation': return <Brain size={16} style={{ color: '#a855f7' }} />;
        case 'recommendations': return <Stethoscope size={16} style={{ color: '#3b82f6' }} />;
        case 'disclaimer': return <Shield size={16} style={{ color: 'var(--text-muted)' }} />;
        default: return <FileText size={16} />;
    }
}

// ─── Measurement row inside joint cards ────────────────────────────

function MeasurementRow({ m }: Readonly<{ m: EnrichedMeasurement }>) {
    const formatMovement = (s: string) =>
        s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const colors = STATUS_COLORS[m.status] ?? STATUS_COLORS.unknown!;
    const pct = m.percentOfNormal ?? 0;
    const barWidth = Math.min(pct, 100);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 0.6fr 0.55fr 0.55fr 1fr 0.7fr',
            alignItems: 'center',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-secondary)',
            fontSize: 13,
        }}>
            <span style={{ fontWeight: 500 }}>{formatMovement(m.movement)}</span>
            <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{m.side}</span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{m.romDegrees}°</span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {m.normalRomDegrees === null ? '—' : `${m.normalRomDegrees}°`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <div style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: colors.track,
                        transition: 'width 0.4s ease',
                    }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, minWidth: 34, textAlign: 'right' }}>
                    {m.percentOfNormal === null ? '—' : `${m.percentOfNormal}%`}
                </span>
            </div>
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                borderRadius: 999, background: colors.bg, color: colors.text,
                justifySelf: 'end', whiteSpace: 'nowrap',
            }}>
                {m.status === 'normal' && <CheckCircle2 size={10} />}
                {(m.status === 'moderate' || m.status === 'severe') && <AlertTriangle size={10} />}
                {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
            </span>
        </div>
    );
}

// ─── Joint Group Card ──────────────────────────────────────────────

function JointGroupCard({ section }: Readonly<{ section: NoteSection }>) {
    const measurements = section.measurements ?? [];
    const deficits = measurements.filter((m) => m.status !== 'normal' && m.status !== 'unknown');

    return (
        <div style={{
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: 16,
        }}>
            {/* Joint header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-primary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{section.title}</span>
                </div>
                {deficits.length > 0 && (
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: '#ea580c',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <AlertTriangle size={11} /> {deficits.length} deficit{deficits.length === 1 ? '' : 's'}
                    </span>
                )}
            </div>

            {/* Column headers */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 0.6fr 0.55fr 0.55fr 1fr 0.7fr',
                padding: '8px 16px',
                borderBottom: '1px solid var(--border-primary)',
            }}>
                {['Movement', 'Side', 'ROM', 'Normal', '% Normal', 'Status'].map((h) => (
                    <span key={h} style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: 'var(--text-muted)',
                        textAlign: h === 'Status' ? 'right' : 'left',
                    }}>{h}</span>
                ))}
            </div>

            {/* Rows */}
            {measurements.map((m) => (
                <MeasurementRow key={`${m.joint}-${m.movement}-${m.side}`} m={m} />
            ))}
        </div>
    );
}

// ─── Text Section (header, summary, disclaimer, etc.) ──────────────

function TextSection({ section }: Readonly<{ section: NoteSection }>) {
    const isPlaceholder = section.content.startsWith('[');
    const isDisclaimer = section.type === 'disclaimer';

    return (
        <div style={{
            padding: '16px 20px',
            background: isDisclaimer ? 'rgba(107,114,128,0.04)' : 'transparent',
            borderLeft: isDisclaimer ? '3px solid var(--border-primary)' : 'none',
            borderRadius: isDisclaimer ? 'var(--radius-sm)' : undefined,
        }}>
            <pre style={{
                fontFamily: isPlaceholder ? 'var(--font-sans)' : 'var(--font-mono)',
                fontSize: isPlaceholder ? 14 : 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                color: isPlaceholder ? 'var(--text-muted)' : 'var(--text-primary)',
                fontStyle: isPlaceholder ? 'italic' : 'normal',
                margin: 0,
            }}>
                {section.content}
            </pre>
        </div>
    );
}

// ─── Main NoteRenderer ─────────────────────────────────────────────

export default function NoteRenderer({
    note,
    onRequestInterpretation,
    isInterpreting,
    plan,
}: Readonly<{
    note: GeneratedNote;
    onRequestInterpretation?: () => void;
    isInterpreting?: boolean;
    plan?: string;
}>) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        const text = noteToPlainText(note);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        globalThis.setTimeout(() => setCopied(false), 2000);
    }, [note]);

    const handlePrint = useCallback(() => {
        globalThis.print();
    }, []);

    return (
        <div data-testid="note-renderer" className="card" style={{ overflow: 'hidden' }}>
            {/* ─── Toolbar ─── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={17} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Clinical Note</h3>
                    <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999,
                        background: 'var(--accent-glow)', color: 'var(--accent)',
                        fontWeight: 600,
                    }}>
                        {note.measurementCount} measurements
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className="btn-secondary"
                        onClick={handleCopy}
                        data-testid="btn-copy-note"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                    >
                        {copied
                            ? (<><ClipboardCheck size={13} /> Copied!</>)
                            : (<><Clipboard size={13} /> Copy</>)}
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={handlePrint}
                        data-testid="btn-print-note"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                    >
                        <Download size={13} /> Print / PDF
                    </button>
                </div>
            </div>

            {/* ─── Sections ─── */}
            <div className="note-print-area" style={{ padding: '4px 0' }}>
                {note.sections.map((section) => (
                    <div key={section.id} data-testid={`note-section-${section.type}`}>
                        {/* Section header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '14px 20px 6px',
                        }}>
                            {sectionIcon(section.type)}
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{section.title}</span>
                        </div>

                        {/* Section body */}
                        {section.type === 'joint_group'
                            ? <div style={{ padding: '8px 20px 4px' }}><JointGroupCard section={section} /></div>
                            : <TextSection section={section} />}

                        {/* AI interpretation button */}
                        {section.type === 'interpretation' && section.content.startsWith('[') && onRequestInterpretation && (
                            <div style={{ padding: '0 20px 16px' }}>
                                <button
                                    className="btn-primary"
                                    onClick={onRequestInterpretation}
                                    disabled={isInterpreting}
                                    data-testid="btn-generate-interpretation"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        fontSize: 13, padding: '10px 20px',
                                    }}
                                >
                                    {isInterpreting
                                        ? (<><Sparkles size={14} className="animate-pulse" /> Analysing...</>)
                                        : (<><Sparkles size={14} /> ✦ Get AI Clinical Interpretation</>)}
                                </button>
                                {plan === 'free' && (
                                    <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                                        (Pro feature — upgrade to unlock)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Footer ─── */}
            <div style={{
                padding: '12px 20px', borderTop: '1px solid var(--border-primary)',
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: 'var(--text-muted)',
            }}>
                <span>Generated {new Date(note.generatedAt).toLocaleString()}</span>
                <span>{note.jointsCovered.join(', ')}</span>
            </div>
        </div>
    );
}
