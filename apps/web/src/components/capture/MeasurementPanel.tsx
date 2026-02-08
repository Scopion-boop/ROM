'use client';

import React from 'react';

interface MeasurementResult {
    joint: string;
    movement: string;
    side: string;
    romDegrees: number;
    confidenceScore: number;
    qualityFlags: { code: string; message: string; severity: string }[];
}

export default function MeasurementPanel({
    measurements,
}: Readonly<{
  measurements: MeasurementResult[];
}>) {
    if (measurements.length === 0) {
        return (
            <div data-testid="measurement-panel-empty">
                <p>No measurements recorded yet.</p>
            </div>
        );
    }

    return (
        <div data-testid="measurement-panel">
            <h3>Measurements</h3>
            <table>
                <thead>
                    <tr>
                        <th>Joint</th>
                        <th>Movement</th>
                        <th>Side</th>
                        <th>ROM (°)</th>
                        <th>Confidence</th>
                        <th>Flags</th>
                    </tr>
                </thead>
                <tbody>
                    {measurements.map((m, i) => (
                        <tr key={`${m.joint}-${m.movement}-${m.side}`} data-testid={`measurement-row-${i}`}>
                            <td>{m.joint}</td>
                            <td>{m.movement}</td>
                            <td>{m.side}</td>
                            <td>{m.romDegrees}</td>
                            <td>{Math.round(m.confidenceScore * 100)}%</td>
                            <td>
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
