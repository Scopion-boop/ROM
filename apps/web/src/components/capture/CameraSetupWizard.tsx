/**
 * CameraSetupWizard – Multi-step wizard for ROM exam session setup.
 *
 * Steps:
 *   1. select_joint  – choose which joints (typed JointType) to measure
 *   2. camera_setup  – live WebcamCapture preview & positioning
 *   3. capture       – GuidedCaptureFlow with WebcamCapture + PoseOverlay
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Camera, Check, ArrowRight, ArrowLeft, Play } from 'lucide-react';
import {
  type JointType,
  type CapturedMeasurement,
  JOINT_TYPES,
  JOINT_META,
  JOINT_MOVEMENT_MAP,
} from '@physiolens/shared-types';
import { WebcamCapture, type WebcamCaptureHandle } from './WebcamCapture';
import { PoseOverlay, type OverlayLandmark, type AngleIndicator } from './PoseOverlay';
import { PhoneCameraLink } from './PhoneCameraLink';
import {
  getAllVisionStrategies,
  getVisionStrategy,
  getDefaultStrategyKey,
} from '../../lib/vision-strategy-registry';

// Register all built-in strategies (side-effect import)
import '../../lib/strategies';

// ─── Constants ─────────────────────────────────────────────────────

type Step = 'select_joint' | 'camera_setup' | 'phone_pair' | 'capture';

const REGION_LABELS: Record<string, string> = {
  upper_extremity: 'Upper Extremity',
  lower_extremity: 'Lower Extremity',
  spine: 'Spine',
};

const REGIONS = ['upper_extremity', 'lower_extremity', 'spine'] as const;

// ─── Component ─────────────────────────────────────────────────────

export default function CameraSetupWizard({
  onComplete,
  initialJoints,
}: Readonly<{
  onComplete: (measurements: CapturedMeasurement[]) => void;
  initialJoints?: JointType[];
}>) {
  const [step, setStep] = useState<Step>(initialJoints ? 'camera_setup' : 'select_joint');
  const [selectedJoints, setSelectedJoints] = useState<JointType[]>(initialJoints ?? []);
  const [landmarks, setLandmarks] = useState<OverlayLandmark[] | null>(null);
  const [angles, setAngles] = useState<AngleIndicator[]>([]);
  const [strategyKey, setStrategyKey] = useState<string>(getDefaultStrategyKey());
  const [secondaryStream, setSecondaryStream] = useState<MediaStream | null>(null);
  const [wizardSessionId] = useState(() => crypto.randomUUID().slice(0, 8));

  const strategies = getAllVisionStrategies();
  const activeStrategy = getVisionStrategy(strategyKey);
  const ActiveComponent = activeStrategy?.component;

  const webcamRef = useRef<WebcamCaptureHandle | null>(null);

  const toggleJoint = (joint: JointType) => {
    setSelectedJoints((prev) =>
      prev.includes(joint) ? prev.filter((j) => j !== joint) : [...prev, joint],
    );
  };

  const handleCaptureComplete = useCallback(
    (captured: CapturedMeasurement[]) => {
      onComplete(captured);
    },
    [onComplete],
  );

  // ── Step 1: Select Joints + Strategy ───────────────────────────
  if (step === 'select_joint') {
    return (
      <div data-testid="step-select-joint" className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 4 }}>
          What are we measuring today?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          PhysioLens will automatically identify landmarks and calculate angles — no calibration
          needed.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          Choose the joints you&apos;d like to capture range-of-motion for.
        </p>

        {/* Vision Strategy Picker */}
        {strategies.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <span
              id="capture-mode-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Capture Mode
            </span>
            <div
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              role="radiogroup"
              aria-labelledby="capture-mode-label"
            >
              {strategies.map((s) => (
                <button
                  key={s.meta.key}
                  data-testid={`strategy-${s.meta.key}`}
                  onClick={() => setStrategyKey(s.meta.key)}
                  className={strategyKey === s.meta.key ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{
                    fontSize: 13,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {s.meta.label}
                </button>
              ))}
            </div>
            {activeStrategy && (
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                {activeStrategy.meta.description}
              </p>
            )}
          </div>
        )}

        {REGIONS.map((region) => {
          const jointsInRegion = JOINT_TYPES.filter((j) => JOINT_META[j].region === region);
          return (
            <fieldset key={region} style={{ border: 0, padding: 0, margin: '0 0 20px 0' }}>
              <legend
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                {REGION_LABELS[region]}
              </legend>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 8,
                }}
              >
                {jointsInRegion.map((joint) => {
                  const meta = JOINT_META[joint];
                  const isSelected = selectedJoints.includes(joint);
                  const movementCount = JOINT_MOVEMENT_MAP[joint]?.length ?? 0;
                  return (
                    <label
                      key={joint}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isSelected ? 'var(--border-accent)' : 'var(--border-primary)'}`,
                        background: isSelected ? 'var(--accent-glow)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleJoint(joint)}
                        data-testid={`joint-${joint}`}
                        style={{ display: 'none' }}
                      />
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                      </span>
                      <span style={{ flex: 1 }}>
                        {meta.label}
                        {meta.bilateral && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'rgba(99,102,241,0.15)',
                              color: 'var(--accent-light)',
                            }}
                          >
                            L + R
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {movementCount} mov.
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-primary"
            disabled={activeStrategy?.meta.requiresJointSelection && selectedJoints.length === 0}
            onClick={() => setStep('camera_setup')}
            data-testid="btn-next-camera"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Camera size={16} /> Camera Setup <ArrowRight size={14} />
          </button>
          {activeStrategy?.meta.requiresJointSelection === false ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Joint selection is optional — auto-detect will find visible joints.
              {selectedJoints.length > 0 &&
                ` (${selectedJoints.length} joint${selectedJoints.length === 1 ? '' : 's'} pre-selected as filter)`}
            </span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {selectedJoints.length} joint{selectedJoints.length === 1 ? '' : 's'} selected
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2: Camera Setup (live preview) ────────────────────────
  if (step === 'camera_setup') {
    return (
      <div data-testid="step-camera-setup" className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 4 }}>Camera Setup</h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Position the camera so the patient&apos;s joints are clearly visible.
        </p>
        <div
          style={{
            width: '100%',
            maxWidth: 640,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-primary)',
          }}
        >
          <WebcamCapture ref={webcamRef} onStreamReady={() => {}} showDeviceSwitcher />
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setStep('select_joint')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setStep('phone_pair')}
            data-testid="btn-start-capture"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Play size={16} /> Next: Phone Pairing
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2b: Phone Pairing (optional) ────────────────────────
  if (step === 'phone_pair') {
    const signalingUrl =
      process.env.NEXT_PUBLIC_SIGNAL_URL ??
      (typeof window === 'undefined'
        ? 'ws://localhost:4001/ws/signaling'
        : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/signaling`);

    return (
      <div data-testid="step-phone-pair" className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 4 }}>
          Pair Phone Camera (Optional)
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Scan the QR code with your phone for a second camera angle. This improves 3D measurement
          accuracy. You can skip this step.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <PhoneCameraLink
            signalingUrl={signalingUrl}
            sessionId={wizardSessionId}
            onRemoteStream={(stream) => setSecondaryStream(stream)}
            onDisconnect={() => setSecondaryStream(null)}
          />
        </div>

        {secondaryStream && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--success)',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ✓ Phone camera connected — dual camera mode active
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setStep('camera_setup')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setStep('capture')}
            data-testid="btn-start-capture-after-pair"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Play size={16} /> {secondaryStream ? 'Start Dual Capture' : 'Skip & Start Capture'}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Capture (hidden WebcamCapture + standalone PoseOverlay)
  if (step === 'capture') {
    return (
      <div data-testid="step-capture" style={{ display: 'flex', gap: 20, width: '100%' }}>
        {/* Hidden webcam — still needed for pose detection */}
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <WebcamCapture ref={webcamRef} />
        </div>

        {/* Skeleton-only view (black background, stick figure) */}
        <div
          style={{
            flex: '0 0 60%',
            minHeight: 480,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-primary)',
            background: '#000',
          }}
        >
          {webcamRef.current?.videoRef && (
            <PoseOverlay
              videoRef={webcamRef.current.videoRef}
              landmarks={landmarks}
              angles={angles}
              standalone
            />
          )}
        </div>

        {/* Right: Vision strategy panel (simplified) */}
        <div style={{ flex: '1 1 40%', minWidth: 300 }}>
          {ActiveComponent ? (
            <ActiveComponent
              joints={selectedJoints.length > 0 ? selectedJoints : undefined}
              webcamRef={webcamRef}
              secondaryStream={secondaryStream}
              onComplete={handleCaptureComplete}
              onLandmarksUpdate={setLandmarks}
              onAngleUpdate={setAngles}
            />
          ) : (
            <div style={{ padding: 20, color: 'var(--text-muted)' }}>
              No vision strategy loaded. Check strategy registration.
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
