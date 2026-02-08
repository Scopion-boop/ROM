'use client';

import React, { useState } from 'react';
import CameraSetupWizard from '../../components/capture/CameraSetupWizard';
import MeasurementPanel from '../../components/capture/MeasurementPanel';
import NoteEditor from '../../components/notes/NoteEditor';

type SessionPhase = 'setup' | 'results' | 'note';

export default function NewSessionPage() {
    const [phase, setPhase] = useState<SessionPhase>('setup');
    const [capturedJoints, setCapturedJoints] = useState<string[]>([]);

    // Placeholder measurements until CV pipeline integration
    const placeholderMeasurements = capturedJoints.map((joint) => ({
        joint,
        movement: 'flexion',
        side: joint.startsWith('right') ? 'right' : 'left',
        romDegrees: 0,
        confidenceScore: 0,
        qualityFlags: [] as { code: string; message: string; severity: string }[],
    }));

    const placeholderBlocks = [
        { id: '1', type: 'header', content: `ROM Examination — ${capturedJoints.length} joint(s)` },
        { id: '2', type: 'free_text', content: '' },
    ];

    const handleWizardComplete = (joints: string[]) => {
        setCapturedJoints(joints);
        setPhase('results');
    };

    if (phase === 'setup') {
        return (
            <main data-testid="new-session-page">
                <h1>New Examination Session</h1>
                <CameraSetupWizard onComplete={handleWizardComplete} />
            </main>
        );
    }

    if (phase === 'results') {
        return (
            <main data-testid="new-session-page">
                <h1>Measurement Results</h1>
                <MeasurementPanel measurements={placeholderMeasurements} />
                <button onClick={() => setPhase('note')} data-testid="btn-proceed-note">
                    Proceed to Note
                </button>
            </main>
        );
    }

    return (
        <main data-testid="new-session-page">
            <h1>Clinical Note</h1>
            <NoteEditor
                blocks={placeholderBlocks}
                onSave={(updatedBlocks: { id: string; type: string; content: string }[]) => {
                    // Deferred: POST to API during E2E wiring
                    console.log('Save:', updatedBlocks);
                }}
                onFinalize={() => {
                    // Deferred: PATCH status during E2E wiring
                    console.log('Finalized');
                }}
            />
        </main>
    );
}
