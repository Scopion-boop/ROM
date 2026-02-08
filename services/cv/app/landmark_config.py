"""Shared landmark configuration — loads the canonical landmark-map.json.

Provides fast lookup for:
  • Landmark index triples (proximal, center, distal) for any joint/movement/side
  • Preferred measurement plane (sagittal, frontal, transverse) for each mapping

The JSON source of truth lives in packages/shared-types/src/clinical/landmark-map.json
and is consumed by both this Python service and the TypeScript frontend/shared-types.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Resolve path to shared landmark-map.json relative to the repo root
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_LANDMARK_MAP_PATH = _REPO_ROOT / "packages" / "shared-types" / "src" / "clinical" / "landmark-map.json"


@dataclass(frozen=True, slots=True)
class LandmarkTriple:
    """Immutable triple of MediaPipe landmark indices for a measurement."""

    proximal: int
    center: int
    distal: int
    preferred_view: str  # "sagittal" | "frontal" | "transverse"


# Module-level cache — loaded once on first access
_cache: dict[str, LandmarkTriple] | None = None


def _load_map() -> dict[str, LandmarkTriple]:
    """Load and parse the landmark-map.json file."""
    global _cache
    if _cache is not None:
        return _cache

    if not _LANDMARK_MAP_PATH.exists():
        raise FileNotFoundError(
            f"landmark-map.json not found at {_LANDMARK_MAP_PATH}. "
            "Ensure packages/shared-types/src/clinical/landmark-map.json exists."
        )

    raw = json.loads(_LANDMARK_MAP_PATH.read_text(encoding="utf-8"))
    result: dict[str, LandmarkTriple] = {}

    for key, entry in raw.items():
        result[key] = LandmarkTriple(
            proximal=entry["proximal"],
            center=entry["center"],
            distal=entry["distal"],
            preferred_view=entry["preferredView"],
        )

    logger.info("Loaded %d landmark mappings from %s", len(result), _LANDMARK_MAP_PATH.name)
    _cache = result
    return _cache


def get_landmark_triple(
    joint: str,
    movement: str,
    side: str,
) -> Optional[LandmarkTriple]:
    """Look up the landmark triple for a (joint, movement, side) combo.

    Returns ``None`` if no mapping exists (e.g. spine movements that
    aren't yet supported in V1).

    Examples
    --------
    >>> triple = get_landmark_triple("shoulder", "flexion", "right")
    >>> triple.proximal, triple.center, triple.distal
    (24, 12, 14)
    >>> triple.preferred_view
    'sagittal'
    """
    mapping = _load_map()
    key = f"{joint}:{movement}:{side}"
    return mapping.get(key)


def get_landmark_indices(
    joint: str,
    movement: str,
    side: str,
) -> Optional[tuple[int, int, int]]:
    """Shortcut returning just the (proximal, center, distal) index tuple."""
    triple = get_landmark_triple(joint, movement, side)
    if triple is None:
        return None
    return (triple.proximal, triple.center, triple.distal)


def get_preferred_plane(
    joint: str,
    movement: str,
    side: str,
) -> Optional[str]:
    """Return the preferred measurement plane for a (joint, movement, side).

    Returns one of: "sagittal", "frontal", "transverse", or None.
    """
    triple = get_landmark_triple(joint, movement, side)
    if triple is None:
        return None
    return triple.preferred_view


def all_keys() -> list[str]:
    """Return all available mapping keys (e.g. for enumeration/testing)."""
    return list(_load_map().keys())


def reload() -> None:
    """Force reload the landmark map from disk (useful in tests)."""
    global _cache
    _cache = None
    _load_map()
