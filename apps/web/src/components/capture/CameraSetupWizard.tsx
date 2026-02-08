'use client';

import React, { useState } from 'react';

export type WizardStep = 'select_joint' | 'camera_setup' | 'capture' | 'review';

const JOINTS = [
    'right_shoulder', 'left_shoulder',
    'right_elbow', 'left_elbow',
    'right_knee', 'left_knee',
    'right_hip', 'left_hip',
    'right_ankle', 'left_ankle',
    'right_wrist', 'left_wrist',
];

export default function CameraSetupWizard({
    onComplete,
}: Readonly<{
    onComplete: (joints: string[]) => void;
}>) {
    const [step, setStep] = useState<WizardStep>('select_joint');
    const [selectedJoints, setSelectedJoints] = useState<string[]>([]);

    const toggleJoint = (joint: string) => {
        setSelectedJoints((prev) =>
            prev.includes(joint) ? prev.filter((j) => j !== joint) : [...prev, joint],
        );
    };

    if (step === 'select_joint') {
        return (
            <div data-testid="step-select-joint">
                <h2>Select Joints to Measure</h2>
                <fieldset>
                    <legend>Joint selection</legend>
                    {JOINTS.map((joint) => (
                        <label key={joint} style={{ display: 'block', margin: '4px 0' }}>
                            <input
                                type="checkbox"
                                checked={selectedJoints.includes(joint)}
                                onChange={() => toggleJoint(joint)}
                                data-testid={`joint-${joint}`}
                            />
                            {' '}{joint.replace('_', ' ')}
                        </label>
                    ))}
                </fieldset>
                <button
                    disabled={selectedJoints.length === 0}
                    onClick={() => setStep('camera_setup')}
                    data-testid="btn-next-camera"
                >
                    Next: Camera Setup
                </button>
            </div>
        );
    }

    if (step === 'camera_setup') {
        return (
            <div data-testid="step-camera-setup">
                <h2>Camera Setup</h2>
                <p>Position the camera so the patient's joints are clearly visible.</p>
                <div data-testid="camera-preview" style={{ width: 640, height: 480, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    Camera preview placeholder
                </div>
                <button onClick={() => setStep('capture')} data-testid="btn-start-capture">
                    Start Capture
                </button>
            </div>
        );
    }

    if (step === 'capture') {
        return (
            <div data-testid="step-capture">
                <h2>Capturing Measurements</h2>
                <p>Guide the patient through the required movements for: {selectedJoints.join(', ')}</p>
                <button onClick={() => setStep('review')} data-testid="btn-finish-capture">
                    Finish Capture
                </button>
            </div>
        );
    }

    // Review step
    return (
        <div data-testid="step-review">
            <h2>Review &amp; Confirm</h2>
            <p>Joints captured: {selectedJoints.join(', ')}</p>
            <button
                onClick={() => onComplete(selectedJoints)}
                data-testid="btn-confirm"
            >
                Confirm &amp; Generate Note
            </button>
        </div>
    );
}
