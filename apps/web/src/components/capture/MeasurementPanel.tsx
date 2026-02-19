'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { EnrichedMeasurement } from '../../lib/rom-utils';

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

// 4-colour clinical data system
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; border: string }> = {
    normal: { bg: 'rgba(74,222,128,0.08)', text: 'rgba(74,222,128,0.8)', label: 'Normal', border: 'rgba(74,222,128,0.2)' },
    mild: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', label: 'Borderline', border: 'rgba(245,158,11,0.2)' },
    moderate: { bg: 'rgba(248,113,113,0.08)', text: '#F87171', label: 'Deficit', border: 'rgba(248,113,113,0.2)' },
    severe: { bg: 'rgba(248,113,113,0.08)', text: '#F87171', label: 'Deficit', border: 'rgba(248,113,113,0.2)' },
    unknown: { bg: 'rgba(75,85,99,0.08)', text: '#4B5563', label: 'No Reference', border: 'rgba(75,85,99,0.2)' },
};

function StatusBadge({ status }: Readonly<{ status: string }>) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown!;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
            fontWeight: 600, padding: '3px 8px', borderRadius: 999,
            background: style.bg, color: style.text,
            border: `1px solid ${style.border}`, whiteSpace: 'nowrap',
        }}>
            {status === 'normal' && <CheckCircle2 size={11} />}
            {status === 'mild' && <TrendingDown size={11} />}
            {(status === 'moderate' || status === 'severe') && <AlertTriangle size={11} />}
            {style.label}
        </span>
    );
}

function ProgressBar({ percent, status }: Readonly<{ percent: number | null; status: string }>) {
    if (percent === null) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown!;
    const capped = Math.min(percent, 120);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                <div style={{
                    width: `${Math.min(capped, 100)}%`, height: '100%', borderRadius: 3,
                    background: style.text, transition: 'width 0.4s ease',
                }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: style.text, minWidth: 38, textAlign: 'right' }}>
                {percent}%
            </span>
            {percent > 100 && <TrendingUp size={12} style={{ color: 'rgba(74,222,128,0.8)' }} />}
        </div>
    );
}

export default function MeasurementPanel({
    measurements,
}: Readonly<{
    measurements: EnrichedMeasurement[];
}>) {
    if (measurements.length === 0) {
        return (
            <div data-testid="measurement-panel-empty" className="card" style={{ padding: 32, textAlign: 'center' }}>
                <Minus size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No measurements recorded yet.</p>
            </div>
        );
    }

    const withNormative = measurements.filter((m) => m.normalRomDegrees !== null);
    const normalCount = measurements.filter((m) => m.status === 'normal').length;
    const deficitCount = withNormative.length - normalCount;

    return (
        <div data-testid="measurement-panel" className="card" style={{ overflow: 'hidden' }}>
            <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>ROM Measurements ({measurements.length})</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    {normalCount > 0 && (
                        <span style={{ fontSize: 12, color: 'rgba(74,222,128,0.8)', fontWeight: 500 }}>
                            <CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                            {normalCount} normal
                        </span>
                    )}
                    {deficitCount > 0 && (
                        <span style={{ fontSize: 12, color: '#F87171', fontWeight: 500 }}>
                            <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                            {deficitCount} deficit{deficitCount === 1 ? '' : 's'}
                        </span>
                    )}
                </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Joint', 'Movement', 'Side', 'ROM (°)', 'Normal (°)', '% Normal', 'Status', 'Confidence'].map((h) => (
                            <th key={h} style={{
                                textAlign: h === 'ROM (°)' || h === 'Normal (°)' || h === 'Confidence' ? 'right' : 'left',
                                padding: '10px 16px', fontSize: 11, fontWeight: 600,
                                color: 'var(--text-muted)', textTransform: 'uppercase',
                                letterSpacing: '0.06em', borderBottom: '1px solid var(--border-primary)',
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {measurements.map((m, i) => (
                        <tr key={`${m.joint}-${m.movement}-${m.side}`} data-testid={`measurement-row-${i}`}
                            style={{
                                borderBottom: i < measurements.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                                background: m.status === 'severe' ? 'rgba(248,113,113,0.03)' : 'transparent',
                            }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{formatJoint(m.joint)}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{formatMovement(m.movement)}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{m.side}</td>
                            <td style={{ padding: '12px 16px', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{m.romDegrees}°</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)', textAlign: 'right', color: 'var(--text-muted)' }}>
                                {m.normalRomDegrees === null ? '—' : `${m.normalRomDegrees}°`}
                            </td>
                            <td style={{ padding: '12px 16px' }}><ProgressBar percent={m.percentOfNormal} status={m.status} /></td>
                            <td style={{ padding: '12px 16px' }}><StatusBadge status={m.status} /></td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    fontSize: 12, fontWeight: 500,
                                    color: m.confidence >= 0.9 ? 'var(--success)' : 'var(--warning)',
                                }}>
                                    {m.confidence >= 0.9 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                    {Math.round(m.confidence * 100)}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
