'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Minus } from 'lucide-react';

interface MeasurementResult {
    joint: string;
    movement: string;
    side: string;
    romDegrees: number;
    confidenceScore: number;
    qualityFlags: { code: string; message: string; severity: string }[];
}

function formatJoint(j: string) {
    return j
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export default function MeasurementPanel({
    measurements,
}: Readonly<{
    measurements: MeasurementResult[];
}>) {
    if (measurements.length === 0) {
        return (
            <div data-testid="measurement-panel-empty" className="card" style={{ padding: 32, textAlign: 'center' }}>
                <Minus size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No measurements recorded yet.</p>
            </div>
        );
    }

    return (
        <div data-testid="measurement-panel" className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Measurements</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Joint', 'Movement', 'Side', 'ROM (°)', 'Confidence', 'Flags'].map((h) => (
                            <th
                                key={h}
                                style={{
                                    textAlign: 'left',
                                    padding: '10px 16px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid var(--border-primary)',
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {measurements.map((m, i) => (
                        <tr
                            key={`${m.joint}-${m.movement}-${m.side}`}
                            data-testid={`measurement-row-${i}`}
                            style={{
                                borderBottom: i < measurements.length - 1 ? '1px solid var(--border-secondary)' : 'none',
                            }}
                        >
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>
                                {formatJoint(m.joint)}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                {m.movement}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                {m.side}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                {m.romDegrees}°
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: m.confidenceScore >= 0.9 ? 'var(--success)' : 'var(--warning)',
                                    }}
                                >
                                    {m.confidenceScore >= 0.9 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                                    {Math.round(m.confidenceScore * 100)}%
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                                {m.qualityFlags.length > 0
                                    ? m.qualityFlags.map((f) => f.code).join(', ')
                                    : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
