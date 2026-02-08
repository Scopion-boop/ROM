"""Frame-based capture routes — process full images and streaming sessions.

Provides:
  POST /process-frame  — single frame → pose + measurements
  WS   /stream         — continuous WebSocket stream with temporal smoothing
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..pipeline import _angle_between_points_3d, _angle_between_points_2d, _assess_quality
from ..pose_estimator import PoseEstimator
from ..schemas import (
    FrameMeasurement,
    FrameRequest,
    FrameResponse,
    PoseLandmarks,
    StreamConfig,
    StreamMeasurement,
)
from ..temporal_filter import TemporalFilter

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Landmark index triples — mirrors packages/shared-types/src/clinical/landmark-map.ts ──
# Maps (joint, movement, side) → (proximal_idx, joint_idx, distal_idx)
# This is a simplified subset; a production build would load from a shared config.

LANDMARK_TRIPLES: dict[tuple[str, str, str], tuple[int, int, int]] = {
    # Shoulder
    ("shoulder", "flexion", "right"): (12, 14, 16),
    ("shoulder", "flexion", "left"): (11, 13, 15),
    ("shoulder", "extension", "right"): (12, 14, 16),
    ("shoulder", "extension", "left"): (11, 13, 15),
    ("shoulder", "abduction", "right"): (23, 11, 13),
    ("shoulder", "abduction", "left"): (24, 12, 14),
    # Elbow
    ("elbow", "flexion", "right"): (12, 14, 16),
    ("elbow", "flexion", "left"): (11, 13, 15),
    ("elbow", "extension", "right"): (12, 14, 16),
    ("elbow", "extension", "left"): (11, 13, 15),
    # Hip
    ("hip", "flexion", "right"): (12, 24, 26),
    ("hip", "flexion", "left"): (11, 23, 25),
    ("hip", "extension", "right"): (12, 24, 26),
    ("hip", "extension", "left"): (11, 23, 25),
    ("hip", "abduction", "right"): (23, 24, 26),
    ("hip", "abduction", "left"): (24, 23, 25),
    # Knee
    ("knee", "flexion", "right"): (24, 26, 28),
    ("knee", "flexion", "left"): (23, 25, 27),
    ("knee", "extension", "right"): (24, 26, 28),
    ("knee", "extension", "left"): (23, 25, 27),
    # Ankle
    ("ankle", "dorsiflexion", "right"): (26, 28, 32),
    ("ankle", "dorsiflexion", "left"): (25, 27, 31),
    ("ankle", "plantarflexion", "right"): (26, 28, 32),
    ("ankle", "plantarflexion", "left"): (25, 27, 31),
    # Cervical spine (midline)
    ("cervical_spine", "flexion", "midline"): (11, 0, 12),
    ("cervical_spine", "extension", "midline"): (11, 0, 12),
    ("cervical_spine", "lateral_flexion", "right"): (11, 0, 12),
    ("cervical_spine", "lateral_flexion", "left"): (11, 0, 12),
    ("cervical_spine", "rotation", "right"): (7, 0, 8),
    ("cervical_spine", "rotation", "left"): (7, 0, 8),
}


def _extract_measurements(
    pose: PoseLandmarks,
    joints: list[str],
    movements: list[str],
    sides: list[str],
    algo_version: str = "v1.0",
) -> list[FrameMeasurement]:
    """Given a PoseLandmarks result, compute angles for requested triples."""
    results: list[FrameMeasurement] = []

    # Use world_landmarks (3D) if available, else normalised
    use_world = bool(pose.world_landmarks and len(pose.world_landmarks) == 33)
    lm_source = pose.world_landmarks if use_world else pose.landmarks
    angle_fn = _angle_between_points_3d if use_world else _angle_between_points_2d

    for joint, movement, side in zip(joints, movements, sides):
        key = (joint, movement, side)
        if key not in LANDMARK_TRIPLES:
            logger.warning("No landmark triple for %s — skipping", key)
            continue

        i_prox, i_joint, i_dist = LANDMARK_TRIPLES[key]
        if max(i_prox, i_joint, i_dist) >= len(lm_source):
            continue

        prox = lm_source[i_prox]
        jt = lm_source[i_joint]
        dist = lm_source[i_dist]

        angle = angle_fn(prox, jt, dist)

        tri_lms = [pose.landmarks[i_prox], pose.landmarks[i_joint], pose.landmarks[i_dist]]
        quality_flags = _assess_quality(tri_lms)

        mean_vis = sum(l.visibility for l in tri_lms) / 3
        confidence = round(mean_vis, 3)

        results.append(
            FrameMeasurement(
                joint=joint,
                movement=movement,
                side=side,
                rom_degrees=round(angle, 2),
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
# WS /stream
# ────────────────────────────────────────────────────────────────────


@router.websocket("/stream")
async def stream_measurement(ws: WebSocket) -> None:
    """WebSocket endpoint for continuous real-time ROM measurement.

    Protocol:
      1. Client sends a ``StreamConfig`` JSON message first.
      2. Client then sends ``StreamFrame`` JSON messages (frame_index + image_base64).
      3. Server replies with a list of ``StreamMeasurement`` JSON messages per frame.
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
        config = StreamConfig(**json.loads(raw))
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
                await ws.send_text(json.dumps({"frame_index": frame_index, "error": "no_pose"}))
                continue

            measurements = _extract_measurements(
                pose,
                config.joints,
                config.movements,
                config.sides,
                config.algorithm_version,
            )

            results: list[dict] = []
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
                )
                results.append(sm.model_dump())

            await ws.send_text(json.dumps({"frame_index": frame_index, "measurements": results}))

    except WebSocketDisconnect:
        logger.info("Stream WebSocket disconnected")
    except Exception:
        logger.exception("Stream error")
    finally:
        temporal.reset_all()
