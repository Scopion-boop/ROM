import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import CameraSetupWizard from '../capture/CameraSetupWizard';
import MeasurementPanel from '../capture/MeasurementPanel';
import NoteRenderer from '../notes/NoteRenderer';
import type { EnrichedMeasurement } from '@/lib/rom-utils';
import type { GeneratedNote } from '@/lib/note-generator';

describe('CameraSetupWizard', () => {
    it('renders joint selection step by default', () => {
        render(<CameraSetupWizard onComplete={vi.fn()} />);
        expect(screen.getByTestId('step-select-joint')).toBeDefined();
        expect(screen.getByText('What are we measuring today?')).toBeDefined();
    });

    it('allows proceeding without joint selection when auto-detect is active', () => {
        render(<CameraSetupWizard onComplete={vi.fn()} />);
        const btn = screen.getByTestId('btn-next-camera');
        // Auto-detect mode does not require joint selection
        expect((btn as HTMLButtonElement).disabled).toBe(false);
    });

    it('enables next button after selecting a joint', () => {
        render(<CameraSetupWizard onComplete={vi.fn()} />);
        fireEvent.click(screen.getByTestId('joint-shoulder'));
        const btn = screen.getByTestId('btn-next-camera');
        expect((btn as HTMLButtonElement).disabled).toBe(false);
    });

    it('advances to camera setup after selecting joint', () => {
        render(<CameraSetupWizard onComplete={vi.fn()} />);

        // Select joint and proceed
        fireEvent.click(screen.getByTestId('joint-knee'));
        fireEvent.click(screen.getByTestId('btn-next-camera'));
        expect(screen.getByTestId('step-camera-setup')).toBeDefined();
    });

    it('advances from camera setup to phone pair', () => {
        render(<CameraSetupWizard onComplete={vi.fn()} />);

        // Select joint → camera setup → phone pair
        fireEvent.click(screen.getByTestId('joint-knee'));
        fireEvent.click(screen.getByTestId('btn-next-camera'));
        fireEvent.click(screen.getByTestId('btn-start-capture'));
        expect(screen.getByTestId('step-phone-pair')).toBeDefined();
    });
});

describe('MeasurementPanel', () => {
    it('renders empty state when no measurements', () => {
        render(<MeasurementPanel measurements={[]} />);
        expect(screen.getByTestId('measurement-panel-empty')).toBeDefined();
        expect(screen.getByText('No measurements recorded yet.')).toBeDefined();
    });

    it('renders measurement rows', () => {
        const measurements: EnrichedMeasurement[] = [
            {
                joint: 'shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 155,
                confidence: 0.93,
                timestamp: Date.now(),
                normalRomDegrees: 180,
                percentOfNormal: 86,
                deficitDegrees: 25,
                withinNormal: false,
                status: 'mild',
            },
        ];
        render(<MeasurementPanel measurements={measurements} />);
        expect(screen.getByTestId('measurement-panel')).toBeDefined();
        expect(screen.getByTestId('measurement-row-0')).toBeDefined();
        expect(screen.getByText('155°')).toBeDefined();
    });
});

describe('NoteRenderer', () => {
    it('renders note sections', () => {
        const note: GeneratedNote = {
            generatedAt: new Date().toISOString(),
            measurementCount: 2,
            deficitCount: 1,
            jointsCovered: ['shoulder'],
            sections: [
                { id: 's1', type: 'header', title: 'ROM Examination', content: 'Header content' },
                { id: 's2', type: 'summary', title: 'Summary', content: 'Overall summary' },
            ],
        };
        render(<NoteRenderer note={note} />);
        expect(screen.getByTestId('note-renderer')).toBeDefined();
        expect(screen.getByText('ROM Examination')).toBeDefined();
        expect(screen.getByText('Summary')).toBeDefined();
    });

    it('renders AI button when interpretation is placeholder', () => {
        const note: GeneratedNote = {
            generatedAt: new Date().toISOString(),
            measurementCount: 1,
            deficitCount: 0,
            jointsCovered: ['shoulder'],
            sections: [
                { id: 's1', type: 'interpretation', title: 'AI Interpretation', content: '[Placeholder: AI interpretation]' },
            ],
        };
        const onRequest = vi.fn();
        render(<NoteRenderer note={note} onRequestInterpretation={onRequest} />);
        const btn = screen.getByTestId('btn-generate-interpretation');
        expect(btn).toBeDefined();
        fireEvent.click(btn);
        expect(onRequest).toHaveBeenCalledTimes(1);
    });
});
