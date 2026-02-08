import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import CameraSetupWizard from '../capture/CameraSetupWizard';
import MeasurementPanel from '../capture/MeasurementPanel';
import NoteEditor from '../notes/NoteEditor';

describe('CameraSetupWizard', () => {
  it('renders joint selection step by default', () => {
    render(<CameraSetupWizard onComplete={vi.fn()} />);
    expect(screen.getByTestId('step-select-joint')).toBeDefined();
    expect(screen.getByText('Select Joints to Measure')).toBeDefined();
  });

  it('disables next button when no joints selected', () => {
    render(<CameraSetupWizard onComplete={vi.fn()} />);
    const btn = screen.getByTestId('btn-next-camera');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables next button after selecting a joint', () => {
    render(<CameraSetupWizard onComplete={vi.fn()} />);
    fireEvent.click(screen.getByTestId('joint-right_shoulder'));
    const btn = screen.getByTestId('btn-next-camera');
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it('advances through all wizard steps', () => {
    const onComplete = vi.fn();
    render(<CameraSetupWizard onComplete={onComplete} />);

    // Select joint and proceed
    fireEvent.click(screen.getByTestId('joint-right_knee'));
    fireEvent.click(screen.getByTestId('btn-next-camera'));
    expect(screen.getByTestId('step-camera-setup')).toBeDefined();

    // Camera setup → capture
    fireEvent.click(screen.getByTestId('btn-start-capture'));
    expect(screen.getByTestId('step-capture')).toBeDefined();

    // Capture → review
    fireEvent.click(screen.getByTestId('btn-finish-capture'));
    expect(screen.getByTestId('step-review')).toBeDefined();

    // Confirm
    fireEvent.click(screen.getByTestId('btn-confirm'));
    expect(onComplete).toHaveBeenCalledWith(['right_knee']);
  });
});

describe('MeasurementPanel', () => {
  it('renders empty state when no measurements', () => {
    render(<MeasurementPanel measurements={[]} />);
    expect(screen.getByTestId('measurement-panel-empty')).toBeDefined();
    expect(screen.getByText('No measurements recorded yet.')).toBeDefined();
  });

  it('renders measurement rows', () => {
    const measurements = [
      {
        joint: 'shoulder',
        movement: 'flexion',
        side: 'right',
        romDegrees: 155,
        confidenceScore: 0.93,
        qualityFlags: [],
      },
    ];
    render(<MeasurementPanel measurements={measurements} />);
    expect(screen.getByTestId('measurement-panel')).toBeDefined();
    expect(screen.getByTestId('measurement-row-0')).toBeDefined();
    expect(screen.getByText('155')).toBeDefined();
    expect(screen.getByText('93%')).toBeDefined();
  });
});

describe('NoteEditor', () => {
  it('renders blocks and edit controls', () => {
    const blocks = [
      { id: '1', type: 'header', content: 'ROM Examination' },
      { id: '2', type: 'free_text', content: '' },
    ];
    render(<NoteEditor blocks={blocks} onSave={vi.fn()} onFinalize={vi.fn()} />);
    expect(screen.getByTestId('note-editor')).toBeDefined();
    expect(screen.getByTestId('note-block-header')).toBeDefined();
    expect(screen.getByTestId('note-block-free_text')).toBeDefined();
    expect(screen.getByTestId('free-text-input')).toBeDefined();
  });

  it('calls onSave with updated blocks', () => {
    const onSave = vi.fn();
    const blocks = [
      { id: '1', type: 'free_text', content: '' },
    ];
    render(<NoteEditor blocks={blocks} onSave={onSave} onFinalize={vi.fn()} />);

    const textarea = screen.getByTestId('free-text-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Patient tolerated exam well.' } });
    fireEvent.click(screen.getByTestId('btn-save-note'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith([
      { id: '1', type: 'free_text', content: 'Patient tolerated exam well.' },
    ]);
  });

  it('calls onFinalize when finalize clicked', () => {
    const onFinalize = vi.fn();
    const blocks = [{ id: '1', type: 'header', content: 'Test' }];
    render(<NoteEditor blocks={blocks} onSave={vi.fn()} onFinalize={onFinalize} />);
    fireEvent.click(screen.getByTestId('btn-finalize-note'));
    expect(onFinalize).toHaveBeenCalledTimes(1);
  });
});
