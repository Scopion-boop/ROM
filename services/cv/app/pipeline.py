"""Core ROM measurement pipeline — angle computation from pose landmarks."""

import math

from .schemas import (
    Landmark,
    MeasurementRequest,
    MeasurementResponse,
    QualityFlag,
)


def _angle_between_points(a: Landmark, b: Landmark, c: Landmark) -> float:
    """Calculate the angle at point B formed by points A-B-C in degrees.

    Uses the 2D (x, y) coordinates. Returns value in [0, 180].
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


def compute_rom_angle(request: MeasurementRequest) -> MeasurementResponse:
    """Compute ROM angle from three ordered landmarks (proximal, joint, distal)."""
    proximal = request.landmarks[0]
    joint_center = request.landmarks[1]
    distal = request.landmarks[2]

    angle = _angle_between_points(proximal, joint_center, distal)

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
        algorithm_version=request.algorithm_version,
    )
