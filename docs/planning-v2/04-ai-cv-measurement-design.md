# 04 - AI/CV Measurement Design

## Measurement pipeline
1. Camera readiness check (distance, body visibility, lighting)
2. Pose landmark detection per frame
3. Landmark smoothing and outlier rejection
4. Joint angle calculation by movement template
5. Rep/window selection (max, min, hold duration)
6. Quality scoring (confidence, occlusion, stability)
7. Persist measurement with metadata
8. Build note snippet

## Versioned algorithm strategy
- `Algo v1`: 2D landmark-based angle estimation with confidence and retake logic
- `Algo v1.1`: improved error handling + movement-quality cues
- `Algo v2`: optional dual-camera/3D fusion for higher precision use cases

## Calibration and quality controls
- Require baseline stance and neutral pose capture
- Enforce camera framing constraints via overlay guides
- Reject low-confidence windows automatically
- Track occlusion and compensation indicators

## Core joints and movement templates (recommended V1)
- Shoulder: flexion, abduction
- Elbow: flexion, extension
- Knee: flexion, extension

## Output schema for each measurement
- `joint`
- `movement`
- `side`
- `rom_degrees`
- `confidence_score`
- `quality_flags[]`
- `capture_duration_ms`
- `algorithm_version`

## Failure modes and fallbacks
- Poor lighting: prompt repositioning
- Partial occlusion: prompt angle change or retry
- Inconsistent landmark tracking: switch to guided slower movement mode
- Hardware underperformance: reduce processing frequency with warning banner

## Clinical guardrails
- Label outputs as “measurement assistance” in V1 unless regulatory pathway allows stronger claims.
- Require clinician confirmation before finalizing note output.
- Store algorithm version for reproducibility and audit.
