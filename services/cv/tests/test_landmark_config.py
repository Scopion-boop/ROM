"""Tests for landmark_config — shared landmark-map.json loader."""

import pytest

from app.landmark_config import (
    LandmarkTriple,
    all_keys,
    get_landmark_indices,
    get_landmark_triple,
    get_preferred_plane,
    reload,
)


class TestLandmarkConfigLoading:
    """Ensure the JSON map loads and caches correctly."""

    def test_loads_non_empty(self) -> None:
        keys = all_keys()
        assert len(keys) >= 72, f"Expected ≥72 mappings, got {len(keys)}"

    def test_reload_does_not_crash(self) -> None:
        reload()
        assert len(all_keys()) >= 72

    def test_cache_consistency(self) -> None:
        """Calling all_keys() twice returns the same list."""
        a = all_keys()
        b = all_keys()
        assert a == b


class TestGetLandmarkTriple:
    """Look up specific known triples and verify indices & plane."""

    @pytest.mark.parametrize(
        "joint, movement, side, expected_prox, expected_center, expected_dist, expected_plane",
        [
            # Shoulder flexion: hip → shoulder → elbow (sagittal)
            ("shoulder", "flexion", "right", 24, 12, 14, "sagittal"),
            ("shoulder", "flexion", "left", 23, 11, 13, "sagittal"),
            # Shoulder abduction: opposite_shoulder → shoulder → elbow (frontal)
            ("shoulder", "abduction", "right", 11, 12, 14, "frontal"),
            ("shoulder", "abduction", "left", 12, 11, 13, "frontal"),
            # Elbow flexion: shoulder → elbow → wrist (sagittal)
            ("elbow", "flexion", "right", 12, 14, 16, "sagittal"),
            ("elbow", "flexion", "left", 11, 13, 15, "sagittal"),
            # Knee flexion: hip → knee → ankle (sagittal)
            ("knee", "flexion", "right", 24, 26, 28, "sagittal"),
            ("knee", "flexion", "left", 23, 25, 27, "sagittal"),
            # Hip flexion: shoulder → hip → knee (sagittal)
            ("hip", "flexion", "right", 12, 24, 26, "sagittal"),
            ("hip", "flexion", "left", 11, 23, 25, "sagittal"),
            # Hip abduction: opposite_hip → hip → knee (frontal)
            ("hip", "abduction", "right", 23, 24, 26, "frontal"),
            # Ankle dorsiflexion: knee → ankle → foot_index (sagittal)
            ("ankle", "dorsiflexion", "right", 26, 28, 32, "sagittal"),
        ],
    )
    def test_known_triples(
        self,
        joint: str,
        movement: str,
        side: str,
        expected_prox: int,
        expected_center: int,
        expected_dist: int,
        expected_plane: str,
    ) -> None:
        triple = get_landmark_triple(joint, movement, side)
        assert triple is not None, f"No mapping for {joint}:{movement}:{side}"
        assert triple.proximal == expected_prox
        assert triple.center == expected_center
        assert triple.distal == expected_dist
        assert triple.preferred_view == expected_plane

    def test_returns_frozen_dataclass(self) -> None:
        triple = get_landmark_triple("shoulder", "flexion", "right")
        assert triple is not None
        assert isinstance(triple, LandmarkTriple)
        with pytest.raises(AttributeError):
            triple.proximal = 999  # type: ignore[misc]

    def test_unknown_key_returns_none(self) -> None:
        assert get_landmark_triple("imaginary", "twist", "left") is None

    def test_case_sensitive(self) -> None:
        """Keys are lowercase — uppercase should fail."""
        assert get_landmark_triple("Shoulder", "Flexion", "Right") is None


class TestGetLandmarkIndices:
    """Shortcut returning (prox, center, dist) tuple."""

    def test_returns_tuple(self) -> None:
        result = get_landmark_indices("knee", "flexion", "right")
        assert result is not None
        assert result == (24, 26, 28)

    def test_unknown_returns_none(self) -> None:
        assert get_landmark_indices("fake", "fake", "midline") is None


class TestGetPreferredPlane:
    """Plane lookup."""

    def test_sagittal(self) -> None:
        assert get_preferred_plane("shoulder", "flexion", "right") == "sagittal"

    def test_frontal(self) -> None:
        assert get_preferred_plane("shoulder", "abduction", "right") == "frontal"

    def test_unknown(self) -> None:
        assert get_preferred_plane("fake", "fake", "midline") is None


class TestAllKeys:
    """all_keys() enumeration."""

    def test_colon_separated_format(self) -> None:
        for key in all_keys():
            parts = key.split(":")
            assert len(parts) == 3, f"Bad key format: {key}"

    def test_known_keys_present(self) -> None:
        keys = set(all_keys())
        assert "shoulder:flexion:right" in keys
        assert "knee:flexion:left" in keys
        assert "hip:abduction:right" in keys

    def test_all_indices_in_range(self) -> None:
        """Every index should be within MediaPipe's 0–32 range."""
        for key in all_keys():
            joint, movement, side = key.split(":")
            triple = get_landmark_triple(joint, movement, side)
            assert triple is not None
            for idx in (triple.proximal, triple.center, triple.distal):
                assert 0 <= idx <= 32, f"{key}: index {idx} outside [0, 32]"
