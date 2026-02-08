"""Frame-based capture routes — process full images, stream, and calibrate.

Provides:
  POST /process-frame  — single frame → pose + measurements
  WS   /stream         — continuous WebSocket stream with temporal smoothing
  POST /calibrate      — capture neutral standing baseline
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..landmark_config import get_landmark_triple, get_preferred_plane
from ..pipeline import (
    _angle_between_points_3d,
    _angle_between_points_2d,
    _assess_quality,
    compute_angle_with_plane,
)
from ..pose_estimator import PoseEstimator
from ..schemas import (
    CalibrationBaseline,
    CalibrationRequest,
    CalibrationResponse,
    FrameMeasurement,
    FrameRequest,
    FrameResponse,
    Landmark,
    PoseLandmarks,
    StreamConfig,
    StreamMeasurement,
    StreamResponse,
)
from ..temporal_filter import TemporalFilter

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Per-session calibration store (in-memory; production → Redis/DB) ────
_calibration_store: dict[str, dict[str, float]] = {}


def _get_calibration_offset(
    session_id: Optional[str],
    joint: str,
    movement: str,
    side: str,
) -> float:
    """Return the calibration baseline offset for a measurement, or 0."""
    if not session_id:
        return 0.0
    baselines = _calibration_store.get(session_id, {})
    key = f"{joint}:{movement}:{side}"
    return baselines.get(key, 0.0)


# ── Measurement extraction (uses shared landmark-map.json) ──────────


def _extract_measurements(
    pose: PoseLandmarks,
    joints: list[str],
    movements: list[str],
    sides: list[str],
    algo_version: str = "v1.0",
    session_id: Optional[str] = None,
) -> list[FrameMeasurement]:
    """Given a PoseLandmarks result, compute angles for requested triples.

    Uses the shared landmark-map.json via ``landmark_config`` for correct
    anatomical landmark indices and plane projection metadata.
    """
    results: list[FrameMeasurement] = []

    # Use world_landmarks (3D) if available, else normalised
    use_world = bool(pose.world_landmarks and len(pose.world_landmarks) == 33)
    lm_source = pose.world_landmarks if use_world else pose.landmarks

    for joint, movement, side in zip(joints, movements, sides):
        triple = get_landmark_triple(joint, movement, side)
        if triple is None:
            logger.warning("No landmark mapping for %s:%s:%s — skipping", joint, movement, side)
            continue

        i_prox, i_center, i_dist = triple.proximal, triple.center, triple.distal
        if max(i_prox, i_center, i_dist) >= len(lm_source):
            logger.warning(
                "Landmark index out of range for %s:%s:%s (max=%d)",
                joint, movement, side, len(lm_source) - 1,
            )
            continue

        prox = lm_source[i_prox]
        center = lm_source[i_center]
        dist = lm_source[i_dist]

        # Compute angle with anatomical plane projection
        angle, algo_suffix = compute_angle_with_plane(
            proximal=prox,
            center=center,
            distal=dist,
            plane=triple.preferred_view,
            use_3d=use_world,
        )

        # Apply calibration offset if available
        offset = _get_calibration_offset(session_id, joint, movement, side)
        adjusted_angle = max(0.0, angle - offset)

        # Quality assessment using normalised landmarks (always have visibility)
        tri_lms = [
            pose.landmarks[i_prox],
            pose.landmarks[i_center],
            pose.landmarks[i_dist],
        ]
        quality_flags = _assess_quality(tri_lms)

        mean_vis = sum(lm.visibility for lm in tri_lms) / 3
        confidence = round(mean_vis, 3)

        results.append(
            FrameMeasurement(
                joint=joint,
                movement=movement,
                side=side,
                rom_degrees=round(adjusted_angle, 2),
                confidence_score=confidence,
                quality_flags=quality_flags,
            )
        )

    return results


# ────────────────────────────────────────────────────────────────────
# POST /process-frame
# ────────────────────────────────────────────────────────────────────


@router.post("/process-frame", response_model=FrameResponse)
async def process_frame(req: FrameRequest) -> FrameResponse:
    """Decode a single image frame, run pose estimation, and return measurements."""
    try:
        image_bytes = base64.b64decode(req.image_base64)
    except Exception:
        return FrameResponse(
            frame_quality="unusable",
            algorithm_version=req.algorithm_version,
        )

    estimator = PoseEstimator.get_instance()
    pose = estimator.detect_from_bytes(image_bytes)

    if pose is None:
        return FrameResponse(
            frame_quality="unusable",
            algorithm_version=req.algorithm_version,
        )

    measurements: list[FrameMeasurement] = []
    if req.joints and req.movements and req.sides:
        measurements = _extract_measurements(
            pose, req.joints, req.movements, req.sides, req.algorithm_version
        )

    # Determine overall quality
    min_vis = min(lm.visibility for lm in pose.landmarks)
    if min_vis < 0.2:
        quality = "unusable"
    elif min_vis < 0.5:
        quality = "degraded"
    else:
        quality = "good"

    return FrameResponse(
        measurements=measurements,
        pose_landmarks=pose,
        frame_quality=quality,
        algorithm_version=req.algorithm_version,
    )


# ────────────────────────────────────────────────────────────────────
# POST /calibrate — neutral standing baseline capture
# ────────────────────────────────────────────────────────────────────


@router.post("/calibrate", response_model=CalibrationResponse)
async def calibrate(req: CalibrationRequest) -> CalibrationResponse:
    """Capture a neutral standing pose and store baseline joint angles.

    The calibration baselines are subtracted from subsequent ROM measurements
    in the same session, establishing a per-patient zero-reference.
    """
    try:
        image_bytes = base64.b64decode(req.image_base64)
    except Exception:
        return CalibrationResponse(
            session_id=req.session_id,
            quality="unusable",
        )

    estimator = PoseEstimator.get_instance()
    pose = estimator.detect_from_bytes(image_bytes)

    if pose is None:
        return CalibrationResponse(
            session_id=req.session_id,
            quality="unusable",
        )

    # Compute baseline angles for ALL supported joint/movement/side combos
    from ..landmark_config import all_keys, get_landmark_triple as _get_triple

    use_world = bool(pose.world_landmarks and len(pose.world_landmarks) == 33)
    lm_source = pose.world_landmarks if use_world else pose.landmarks

    baselines: list[CalibrationBaseline] = []
    baseline_map: dict[str, float] = {}

    for key in all_keys():
        parts = key.split(":")
        if len(parts) != 3:
            continue
        joint, movement, side = parts

        triple = _get_triple(joint, movement, side)
        if triple is None:
            continue

        i_prox, i_center, i_dist = triple.proximal, triple.center, triple.distal
        if max(i_prox, i_center, i_dist) >= len(lm_source):
            continue

        prox = lm_source[i_prox]
        center = lm_source[i_center]
        dist = lm_source[i_dist]

        angle, _ = compute_angle_with_plane(
            proximal=prox,
            center=center,
            distal=dist,
            plane=triple.preferred_view,
            use_3d=use_world,
        )

        # Quality check
        tri_lms = [
            pose.landmarks[i_prox],
            pose.landmarks[i_center],
            pose.landmarks[i_dist],
        ]
        mean_vis = sum(lm.visibility for lm in tri_lms) / 3

        baselines.append(
            CalibrationBaseline(
                joint=joint,
                movement=movement,
                side=side,
                baseline_degrees=round(angle, 2),
                confidence_score=round(mean_vis, 3),
            )
        )
        baseline_map[key] = round(angle, 2)

    # Store baselines for this session
    _calibration_store[req.session_id] = baseline_map
    logger.info(
        "Calibration captured for session %s: %d baselines",
        req.session_id,
        len(baselines),
    )

    # Overall quality
    min_vis = min(lm.visibility for lm in pose.landmarks)
    if min_vis < 0.2:
        quality = "unusable"
    elif min_vis < 0.5:
        quality = "degraded"
    else:
        quality = "good"

    return CalibrationResponse(
        session_id=req.session_id,
        baselines=baselines,
        pose_landmarks=pose,
        quality=quality,
    )


# ────────────────────────────────────────────────────────────────────
# WS /stream
# ────────────────────────────────────────────────────────────────────


@router.websocket("/stream")
async def stream_measurement(ws: WebSocket) -> None:
    """WebSocket endpoint for continuous real-time ROM measurement.

    Protocol:
      1. Client sends a ``StreamConfig`` JSON message first.
      2. Client then sends ``StreamFrame`` JSON messages (frame_index + image_base64).
      3. Server replies with ``StreamResponse`` JSON (measurements + pose landmarks).
      4. Client sends ``{"type": "stop"}`` to end gracefully.
    """
    await ws.accept()
    logger.info("Stream WebSocket connected")

    estimator = PoseEstimator.get_instance()

    # Wait for config
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=10.0)
    except (asyncio.TimeoutError, WebSocketDisconnect):
        await ws.close(code=1008, reason="Config not received in time")
        return

    try:
        config_data = json.loads(raw)
        session_id = config_data.pop("session_id", None)
        config = StreamConfig(**config_data)
    except Exception as e:
        await ws.close(code=1008, reason=f"Invalid config: {e}")
        return

    temporal = TemporalFilter(
        window_size=config.temporal_window,
        stability_threshold_degrees=config.auto_capture_threshold_degrees,
        stability_hold_ms=float(config.auto_capture_hold_ms),
    )

    logger.info("Stream configured: joints=%s, fps=%d", config.joints, config.fps_target)

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "stop":
                logger.info("Stream stop requested")
                break

            frame_index = msg.get("frame_index", 0)
            image_b64 = msg.get("image_base64", "")

            try:
                image_bytes = base64.b64decode(image_b64)
            except Exception:
                continue

            pose = estimator.detect_from_bytes(image_bytes)
            if pose is None:
                resp = StreamResponse(frame_index=frame_index, error="no_pose")
                await ws.send_text(resp.model_dump_json())
                continue

            measurements = _extract_measurements(
                pose,
                config.joints,
                config.movements,
                config.sides,
                config.algorithm_version,
                session_id=session_id,
            )

            results: list[StreamMeasurement] = []
            for m in measurements:
                channel_key = f"{m.joint}-{m.movement}-{m.side}"
                ts = time.monotonic() * 1000.0
                stability = temporal.push(channel_key, m.rom_degrees, ts)

                sm = StreamMeasurement(
                    frame_index=frame_index,
                    joint=m.joint,
                    movement=m.movement,
                    side=m.side,
                    rom_degrees=m.rom_degrees,
                    smoothed_rom_degrees=stability.smoothed_degrees,
                    confidence_score=m.confidence_score,
                    quality_flags=m.quality_flags,
                    is_stable=stability.is_stable,
                    stable_for_ms=int(stability.stable_since_ms),
                    auto_captured=stability.auto_captured,
                    algorithm_version=config.algorithm_version,
                )
                results.append(sm)

            # Send back measurements + normalised landmarks for PoseOverlay
            landmarks_out = [
                lm.model_dump() for lm in pose.landmarks
            ]

            resp = StreamResponse(
                frame_index=frame_index,
                measurements=results,
                pose_landmarks=[
                    Landmark(**lm) for lm in landmarks_out
                ],
            )
            await ws.send_text(resp.model_dump_json())

    except WebSocketDisconnect:
        logger.info("Stream WebSocket disconnected")
    except Exception:
        logger.exception("Stream error")
    finally:
        temporal.reset_all()
