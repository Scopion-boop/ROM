"""Tests for the ROM measurement pipeline."""

import math

from app.pipeline import compute_rom_angle
from app.schemas import Landmark, MeasurementRequest


def _make_request(
    landmarks: list[Landmark],
    joint: str = "knee",
    movement: str = "flexion",
    side: str = "right",
) -> MeasurementRequest:
    return MeasurementRequest(
        joint=joint,
        movement=movement,
        side=side,
        landmarks=landmarks,
    )


class TestAngleComputation:
    """Test ROM angle calculation from landmarks."""

    def test_right_angle(self) -> None:
        """Three points forming a 90° angle at the joint center."""
        landmarks = [
            Landmark(x=0.0, y=0.5, visibility=1.0),  # proximal
            Landmark(x=0.5, y=0.5, visibility=1.0),  # joint center
            Landmark(x=0.5, y=0.0, visibility=1.0),  # distal
        ]
        result = compute_rom_angle(_make_request(landmarks))
        assert abs(result.rom_degrees - 90.0) < 0.01

    def test_straight_line_180(self) -> None:
        """Three collinear points should yield ~180°."""
        landmarks = [
            Landmark(x=0.0, y=0.5, visibility=1.0),
            Landmark(x=0.5, y=0.5, visibility=1.0),
            Landmark(x=1.0, y=0.5, visibility=1.0),
        ]
        result = compute_rom_angle(_make_request(landmarks))
        assert abs(result.rom_degrees - 180.0) < 0.01

    def test_45_degree_angle(self) -> None:
        """Three points forming a 45° angle.

        Vertex at (1,0), one arm to (0,0) (pointing left), the other
        arm to (1,1) (pointing up).  The angle between these two rays
        is 90°.  For a true 45° we need one arm along the x-axis
        and the other at 45° — vertex (0,0), point-a (1,0), point-b
        at (cos45, sin45) ≈ (0.7071, 0.7071).
        """
        import math

        landmarks = [
            Landmark(x=1.0, y=0.0, visibility=1.0),         # point A
            Landmark(x=0.0, y=0.0, visibility=1.0),         # vertex
            Landmark(x=math.cos(math.radians(45)), y=math.sin(math.radians(45)), visibility=1.0),  # point B
        ]
        result = compute_rom_angle(_make_request(landmarks))
        assert abs(result.rom_degrees - 45.0) < 0.5

    def test_confidence_high_visibility(self) -> None:
        """Full visibility should yield confidence near 1.0."""
        landmarks = [
            Landmark(x=0.0, y=0.5, visibility=1.0),
            Landmark(x=0.5, y=0.5, visibility=1.0),
            Landmark(x=0.5, y=0.0, visibility=1.0),
        ]
        result = compute_rom_angle(_make_request(landmarks))
        assert abs(result.confidence_score - 1.0) < 0.001
        assert len(result.quality_flags) == 0

    def test_low_visibility_flag(self) -> None:
        """Low visibility should produce a warning flag."""
        landmarks = [
            Landmark(x=0.0, y=0.5, visibility=0.3),
            Landmark(x=0.5, y=0.5, visibility=0.9),
            Landmark(x=0.5, y=0.0, visibility=0.8),
        ]
        result = compute_rom_angle(_make_request(landmarks))
        assert any(f.code == "LOW_VISIBILITY" for f in result.quality_flags)

    def test_severe_occlusion_reduces_confidence(self) -> None:
        """Severe occlusion should halve confidence and add error flag."""
        landmarks = [
            Landmark(x=0.0, y=0.5, visibility=0.1),
            Landmark(x=0.5, y=0.5, visibility=0.9),
            Landmark(x=0.5, y=0.0, visibility=0.8),
        ]
        result = compute_rom_angle(_make_request(landmarks))
        assert any(f.code == "OCCLUSION" for f in result.quality_flags)
        assert result.confidence_score < 0.5

    def test_output_fields_populated(self) -> None:
        """All response fields should be populated."""
        landmarks = [
            Landmark(x=0.0, y=0.5, visibility=1.0),
            Landmark(x=0.5, y=0.5, visibility=1.0),
            Landmark(x=0.5, y=0.0, visibility=1.0),
        ]
        result = compute_rom_angle(
            _make_request(landmarks, joint="shoulder", movement="abduction", side="left")
        )
        assert result.joint == "shoulder"
        assert result.movement == "abduction"
        assert result.side == "left"
        assert result.algorithm_version == "v1.0"
        assert isinstance(result.rom_degrees, float)
