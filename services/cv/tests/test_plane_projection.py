"""Tests for anatomical plane projection and plane-aware angle computation."""

import math

import pytest

from app.pipeline import (
    _project_to_plane,
    compute_angle_with_plane,
    compute_rom_angle,
    _angle_between_points_2d,
    _angle_between_points_3d,
)
from app.schemas import Landmark, MeasurementRequest


# ── Helpers ─────────────────────────────────────────────────────────


def _lm(x: float, y: float, z: float = 0.0, vis: float = 1.0) -> Landmark:
    return Landmark(x=x, y=y, z=z, visibility=vis)


# ── Plane Projection Tests ──────────────────────────────────────────


class TestProjectToPlane:
    """_project_to_plane zeroes the correct coordinate."""

    def test_sagittal_zeroes_z(self) -> None:
        result = _project_to_plane(_lm(0.1, 0.2, 0.3), "sagittal")
        assert result.x == pytest.approx(0.1)
        assert result.y == pytest.approx(0.2)
        assert result.z == pytest.approx(0.0)
        assert result.visibility == pytest.approx(1.0)

    def test_frontal_zeroes_x(self) -> None:
        result = _project_to_plane(_lm(0.1, 0.2, 0.3), "frontal")
        assert result.x == pytest.approx(0.0)
        assert result.y == pytest.approx(0.2)
        assert result.z == pytest.approx(0.3)

    def test_transverse_zeroes_y(self) -> None:
        result = _project_to_plane(_lm(0.1, 0.2, 0.3), "transverse")
        assert result.x == pytest.approx(0.1)
        assert result.y == pytest.approx(0.0)
        assert result.z == pytest.approx(0.3)

    def test_unknown_plane_returns_unmodified(self) -> None:
        lm = _lm(0.1, 0.2, 0.3)
        result = _project_to_plane(lm, "coronal")  # not a valid plane name
        assert result.x == pytest.approx(0.1)
        assert result.y == pytest.approx(0.2)
        assert result.z == pytest.approx(0.3)

    def test_preserves_visibility(self) -> None:
        result = _project_to_plane(_lm(1.0, 2.0, 3.0, vis=0.75), "sagittal")
        assert result.visibility == pytest.approx(0.75)


# ── compute_angle_with_plane Tests ──────────────────────────────────


class TestComputeAngleWithPlane:
    """Full angle computation with optional plane projection."""

    def test_90_degrees_no_plane(self) -> None:
        """Classic 90° right angle without projection."""
        a = _lm(0.0, 0.5)
        b = _lm(0.5, 0.5)
        c = _lm(0.5, 0.0)
        angle, suffix = compute_angle_with_plane(a, b, c, plane=None, use_3d=False)
        assert abs(angle - 90.0) < 0.01
        assert suffix == "-2d"

    def test_180_degrees_straight(self) -> None:
        a = _lm(0.0, 0.5)
        b = _lm(0.5, 0.5)
        c = _lm(1.0, 0.5)
        angle, suffix = compute_angle_with_plane(a, b, c, plane=None, use_3d=False)
        assert abs(angle - 180.0) < 0.01

    def test_3d_suffix_when_depth_present(self) -> None:
        """When use_3d=True and z is non-zero, should use 3D algorithm."""
        a = _lm(0.0, 0.5, 0.1)
        b = _lm(0.5, 0.5, 0.2)
        c = _lm(0.5, 0.0, 0.1)
        angle, suffix = compute_angle_with_plane(a, b, c, plane=None, use_3d=True)
        assert suffix == "-3d"
        assert 0 <= angle <= 180

    def test_sagittal_projection_suffix(self) -> None:
        """Sagittal plane + depth → 3d-sagittal suffix."""
        a = _lm(0.0, 0.5, 0.1)
        b = _lm(0.5, 0.5, 0.2)
        c = _lm(0.5, 0.0, 0.3)
        angle, suffix = compute_angle_with_plane(a, b, c, plane="sagittal", use_3d=True)
        assert suffix == "-3d-sagittal"

    def test_frontal_projection_suffix(self) -> None:
        a = _lm(0.0, 0.5, 0.1)
        b = _lm(0.5, 0.5, 0.2)
        c = _lm(0.5, 0.0, 0.3)
        angle, suffix = compute_angle_with_plane(a, b, c, plane="frontal", use_3d=True)
        assert suffix == "-3d-frontal"

    def test_transverse_projection_suffix(self) -> None:
        a = _lm(0.0, 0.5, 0.1)
        b = _lm(0.5, 0.5, 0.2)
        c = _lm(0.5, 0.0, 0.3)
        angle, suffix = compute_angle_with_plane(a, b, c, plane="transverse", use_3d=True)
        assert suffix == "-3d-transverse"

    def test_fallback_to_2d_when_no_depth(self) -> None:
        """With plane specified but z=0, should fall back to 2D."""
        a = _lm(0.0, 0.5, 0.0)
        b = _lm(0.5, 0.5, 0.0)
        c = _lm(0.5, 0.0, 0.0)
        angle, suffix = compute_angle_with_plane(a, b, c, plane="sagittal", use_3d=True)
        assert suffix == "-2d"

    def test_sagittal_removes_depth_noise(self) -> None:
        """Sagittal projection should make z-noise irrelevant.

        Two arrangements that differ ONLY in z should produce identical
        angles when projected onto sagittal (XY).
        """
        # Pure XY arrangement: 90° angle
        a1 = _lm(0.0, 0.5, 0.0)
        b1 = _lm(0.5, 0.5, 0.0)
        c1 = _lm(0.5, 0.0, 0.0)

        # Same XY, randomish z values — sagittal projection should ignore z
        a2 = _lm(0.0, 0.5, 0.3)
        b2 = _lm(0.5, 0.5, -0.1)
        c2 = _lm(0.5, 0.0, 0.7)

        angle1, _ = compute_angle_with_plane(a1, b1, c1, plane="sagittal", use_3d=True)
        angle2, _ = compute_angle_with_plane(a2, b2, c2, plane="sagittal", use_3d=True)

        # Angle1 will fallback to 2d (no depth), so compute it manually
        angle1_2d = _angle_between_points_2d(a1, b1, c1)

        assert abs(angle2 - angle1_2d) < 0.01, (
            f"Sagittal projection should produce same angle regardless of z: "
            f"got {angle2:.2f} vs {angle1_2d:.2f}"
        )

    def test_angle_range(self) -> None:
        """Angle should always be in [0, 180]."""
        import random

        random.seed(42)
        for _ in range(50):
            pts = [
                _lm(random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))
                for _ in range(3)
            ]
            angle, _ = compute_angle_with_plane(pts[0], pts[1], pts[2], plane="sagittal", use_3d=True)
            assert 0 <= angle <= 180, f"Angle out of range: {angle}"


# ── Legacy compute_rom_angle still works ────────────────────────────


class TestLegacyComputeRomAngle:
    """Backward compatibility: compute_rom_angle should still pass."""

    def test_right_angle(self) -> None:
        landmarks = [_lm(0.0, 0.5), _lm(0.5, 0.5), _lm(0.5, 0.0)]
        req = MeasurementRequest(
            joint="knee", movement="flexion", side="right", landmarks=landmarks
        )
        result = compute_rom_angle(req)
        assert abs(result.rom_degrees - 90.0) < 0.01

    def test_180_degrees(self) -> None:
        landmarks = [_lm(0.0, 0.5), _lm(0.5, 0.5), _lm(1.0, 0.5)]
        req = MeasurementRequest(
            joint="knee", movement="extension", side="right", landmarks=landmarks
        )
        result = compute_rom_angle(req)
        assert abs(result.rom_degrees - 180.0) < 0.01

    def test_zero_length_vector(self) -> None:
        """Degenerate case — two coincident points should yield 0°."""
        landmarks = [_lm(0.5, 0.5), _lm(0.5, 0.5), _lm(0.5, 0.0)]
        req = MeasurementRequest(
            joint="knee", movement="flexion", side="right", landmarks=landmarks
        )
        result = compute_rom_angle(req)
        assert result.rom_degrees == 0.0


# ── 2D vs 3D consistency ───────────────────────────────────────────


class TestAngleConsistency:
    """Verify that 2D and 3D angles agree when z=0."""

    def test_2d_3d_same_when_flat(self) -> None:
        a = _lm(0.0, 0.5, 0.0)
        b = _lm(0.5, 0.5, 0.0)
        c = _lm(0.5, 0.0, 0.0)
        angle_2d = _angle_between_points_2d(a, b, c)
        angle_3d = _angle_between_points_3d(a, b, c)
        assert abs(angle_2d - angle_3d) < 0.001

    def test_45_degrees_both_methods(self) -> None:
        a = _lm(1.0, 0.0, 0.0)
        b = _lm(0.0, 0.0, 0.0)
        c = _lm(math.cos(math.radians(45)), math.sin(math.radians(45)), 0.0)
        angle_2d = _angle_between_points_2d(a, b, c)
        angle_3d = _angle_between_points_3d(a, b, c)
        assert abs(angle_2d - 45.0) < 0.5
        assert abs(angle_3d - 45.0) < 0.5
