"""Core ROM measurement pipeline — angle computation from pose landmarks.

Supports both 2D (x,y) and 3D (x,y,z) angle computation.
3D mode uses world_landmarks from MediaPipe PoseLandmarker for accurate
depth-aware measurements across all planes (sagittal, frontal, transverse).
"""

import math

from .schemas import (
    Landmark,
    MeasurementRequest,
    MeasurementResponse,
    QualityFlag,
)


def _angle_between_points_2d(a: Landmark, b: Landmark, c: Landmark) -> float:
    """Calculate the angle at point B formed by points A-B-C using 2D (x,y).

    Returns value in [0, 180].
    """
    ba_x = a.x - b.x
    ba_y = a.y - b.y
    bc_x = c.x - b.x
    bc_y = c.y - b.y

    dot = ba_x * bc_x + ba_y * bc_y
    mag_ba = math.sqrt(ba_x**2 + ba_y**2)
    mag_bc = math.sqrt(bc_x**2 + bc_y**2)

    if mag_ba == 0 or mag_bc == 0:
        return 0.0

    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_angle))


def _angle_between_points_3d(a: Landmark, b: Landmark, c: Landmark) -> float:
    """Calculate the angle at point B formed by points A-B-C using 3D (x,y,z).

    Uses all three spatial coordinates for accurate depth-aware measurement.
    Returns value in [0, 180].
    """
    ba_x = a.x - b.x
    ba_y = a.y - b.y
    ba_z = a.z - b.z
    bc_x = c.x - b.x
    bc_y = c.y - b.y
    bc_z = c.z - b.z

    dot = ba_x * bc_x + ba_y * bc_y + ba_z * bc_z
    mag_ba = math.sqrt(ba_x**2 + ba_y**2 + ba_z**2)
    mag_bc = math.sqrt(bc_x**2 + bc_y**2 + bc_z**2)

    if mag_ba == 0 or mag_bc == 0:
        return 0.0

    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_angle))


def _angle_between_points(a: Landmark, b: Landmark, c: Landmark) -> float:
    """Calculate the angle at point B — delegates to 2D implementation.

    Kept for backward compatibility with existing callers/tests.
    """
    return _angle_between_points_2d(a, b, c)


def _assess_quality(landmarks: list[Landmark]) -> list[QualityFlag]:
    """Assess landmark quality and return flags."""
    flags: list[QualityFlag] = []

    min_visibility = min(lm.visibility for lm in landmarks)
    if min_visibility < 0.5:
        flags.append(
            QualityFlag(
                code="LOW_VISIBILITY",
                message=f"Minimum landmark visibility is {min_visibility:.2f} (< 0.5 threshold)",
                severity="warning",
            )
        )

    if min_visibility < 0.2:
        flags.append(
            QualityFlag(
                code="OCCLUSION",
                message="Severe occlusion detected — measurement may be unreliable",
                severity="error",
            )
        )

    return flags


def _has_meaningful_depth(landmarks: list[Landmark]) -> bool:
    """Check if landmarks have non-trivial z values (not all zero)."""
    return any(abs(lm.z) > 1e-6 for lm in landmarks)


def compute_rom_angle(request: MeasurementRequest) -> MeasurementResponse:
    """Compute ROM angle from three ordered landmarks (proximal, joint, distal).

    If use_3d is True and landmarks have meaningful z-coordinates,
    uses 3D vector math for depth-accurate measurement. Otherwise
    falls back to 2D computation.
    """
    proximal = request.landmarks[0]
    joint_center = request.landmarks[1]
    distal = request.landmarks[2]

    # Decide 2D vs 3D
    use_3d = getattr(request, "use_3d", True)
    if use_3d and _has_meaningful_depth(request.landmarks):
        angle = _angle_between_points_3d(proximal, joint_center, distal)
        algo_suffix = "-3d"
    else:
        angle = _angle_between_points_2d(proximal, joint_center, distal)
        algo_suffix = "-2d"

    quality_flags = _assess_quality(request.landmarks)

    # Confidence based on landmark visibility mean
    mean_visibility = sum(lm.visibility for lm in request.landmarks) / len(request.landmarks)
    confidence = round(mean_visibility, 3)

    # Reduce confidence if quality issues exist
    error_count = sum(1 for f in quality_flags if f.severity == "error")
    if error_count > 0:
        confidence = round(confidence * 0.5, 3)

    return MeasurementResponse(
        joint=request.joint,
        movement=request.movement,
        side=request.side,
        rom_degrees=round(angle, 2),
        confidence_score=confidence,
        quality_flags=quality_flags,
        algorithm_version=request.algorithm_version + algo_suffix,
    )
