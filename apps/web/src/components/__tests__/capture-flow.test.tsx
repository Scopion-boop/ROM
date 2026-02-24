import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import CameraSetupWizard from '../capture/CameraSetupWizard';
import MeasurementPanel from '../capture/MeasurementPanel';
import NoteRenderer from '../notes/NoteRenderer';
import type { EnrichedMeasurement } from '@/lib/rom-utils';
import type { GeneratedNote } from '@/lib/note-generator';

// Mock WebRTC and WebSocket APIs for jsdom/happy-dom environment
globalThis.RTCPeerConnection = vi.fn().mockImplementation(() => ({
    ontrack: null,
    onicecandidate: null,
    onconnectionstatechange: null,
    connectionState: 'new',
    addTrack: vi.fn(),
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: '' }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: '' }),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
})) as unknown as typeof RTCPeerConnection;

globalThis.RTCSessionDescription = vi.fn().mockImplementation((init) => init) as unknown as typeof RTCSessionDescription;
globalThis.RTCIceCandidate = vi.fn().mockImplementation((init) => init) as unknown as typeof RTCIceCandidate;

const mockWsSend = vi.fn();
const mockWsClose = vi.fn();
globalThis.WebSocket = vi.fn().mockImplementation(() => ({
    readyState: 1,
    send: mockWsSend,
    close: mockWsClose,
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    OPEN: 1,
})) as unknown as typeof WebSocket;
Object.assign(globalThis.WebSocket, { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2 });

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
                suspectAccuracy: false,
            },
        ];
        render(<MeasurementPanel measurements={measurements} />);
        expect(screen.getByTestId('measurement-panel')).toBeDefined();
        expect(screen.getByTestId('measurement-row-0')).toBeDefined();
        expect(screen.getByText('155°')).toBeDefined();
    });
});

describe('NoteRenderer', () => {
    it('renders toolbar and simplified text box', () => {
        const note: GeneratedNote = {
            generatedAt: new Date().toISOString(),
            measurementCount: 2,
            deficitCount: 1,
            jointsCovered: ['shoulder'],
            simplifiedText: 'Left Shoulder\n- Flexion 155° (normal: 0-180°)',
            sections: [],
        };
        render(<NoteRenderer note={note} />);
        expect(screen.getByTestId('note-renderer')).toBeDefined();
        expect(screen.getByText('Clinical Note')).toBeDefined();
        expect(screen.getByTestId('btn-copy-note')).toBeDefined();
        expect(screen.getByTestId('btn-print-note')).toBeDefined();
    });

    it('shows measurement count badge', () => {
        const note: GeneratedNote = {
            generatedAt: new Date().toISOString(),
            measurementCount: 3,
            deficitCount: 0,
            jointsCovered: ['shoulder', 'knee'],
            simplifiedText: 'Right Knee\n- Flexion 130°',
            sections: [],
        };
        render(<NoteRenderer note={note} />);
        expect(screen.getByText('3 measurements')).toBeDefined();
    });
});
