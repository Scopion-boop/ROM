"""MediaPipe PoseLandmarker wrapper for full-body pose estimation.

Accepts raw image bytes, runs MediaPipe PoseLandmarker (heavy model),
and returns 33 normalised + 33 world landmarks per detected person.
The heavy model provides world_landmarks in real-world metres — essential
for depth-aware 3D ROM measurement.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np

from .schemas import Landmark, PoseLandmarks

logger = logging.getLogger(__name__)

# Lazy-loaded singleton — avoids import-time model download
_estimator: Optional["PoseEstimator"] = None

# Default model asset path (downloaded on first use)
_MODEL_DIR = Path(__file__).parent / "models"
_MODEL_FILENAME = "pose_landmarker_heavy.task"


class PoseEstimator:
    """Wraps MediaPipe PoseLandmarker for synchronous image inference.

    Usage::

        estimator = PoseEstimator.get_instance()
        result = estimator.detect(image_bytes)
        if result:
            landmarks = result.landmarks  # normalised [0,1]
            world = result.world_landmarks  # metres
    """

    def __init__(self, model_path: str | Path | None = None, num_poses: int = 1):
        try:
            import mediapipe as mp  # type: ignore[import-untyped]
        except ImportError as exc:
            raise RuntimeError(
                "mediapipe is not installed. Run: pip install mediapipe>=0.10.14"
            ) from exc

        self._mp = mp
        resolved_path = self._resolve_model(model_path)

        BaseOptions = mp.tasks.BaseOptions
        PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode

        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(resolved_path)),
            running_mode=VisionRunningMode.IMAGE,
            num_poses=num_poses,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_segmentation_masks=False,
        )
        self._landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(options)
        logger.info("PoseEstimator initialised (model=%s, num_poses=%d)", resolved_path.name, num_poses)

    # ------------------------------------------------------------------
    # Model resolution
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_model(model_path: str | Path | None) -> Path:
        """Return a valid model path — downloads the heavy model if missing."""
        if model_path:
            p = Path(model_path)
            if p.exists():
                return p
            raise FileNotFoundError(f"Model not found: {p}")

        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        target = _MODEL_DIR / _MODEL_FILENAME
        if target.exists():
            return target

        # Download from MediaPipe model hub
        import urllib.request

        url = (
            "https://storage.googleapis.com/mediapipe-models/"
            "pose_landmarker/pose_landmarker_heavy/float16/latest/"
            "pose_landmarker_heavy.task"
        )
        logger.info("Downloading PoseLandmarker heavy model → %s …", target)
        urllib.request.urlretrieve(url, target)
        logger.info("Download complete (%d bytes)", target.stat().st_size)
        return target

    # ------------------------------------------------------------------
    # Singleton
    # ------------------------------------------------------------------

    @classmethod
    def get_instance(cls, **kwargs) -> "PoseEstimator":
        """Return (or create) the module-level singleton."""
        global _estimator
        if _estimator is None:
            _estimator = cls(**kwargs)
        return _estimator

    # ------------------------------------------------------------------
    # Detection
    # ------------------------------------------------------------------

    def detect_from_bytes(self, image_bytes: bytes) -> PoseLandmarks | None:
        """Run pose detection on raw image bytes (JPEG/PNG/WebP).

        Returns ``PoseLandmarks`` for the first detected person, or ``None``
        if no pose is detected.
        """
        mp_image = self._bytes_to_mp_image(image_bytes)
        result = self._landmarker.detect(mp_image)

        if not result.pose_landmarks:
            return None

        return self._result_to_schema(result)

    def detect_from_ndarray(self, bgr_frame: np.ndarray) -> PoseLandmarks | None:
        """Run pose detection on a BGR OpenCV ndarray (H×W×3 uint8)."""
        import mediapipe as mp  # type: ignore[import-untyped]

        rgb = bgr_frame[..., ::-1].copy()
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self._landmarker.detect(mp_image)

        if not result.pose_landmarks:
            return None

        return self._result_to_schema(result)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _bytes_to_mp_image(self, image_bytes: bytes):
        """Decode raw bytes → MediaPipe Image via numpy/cv2."""
        import cv2  # type: ignore[import-untyped]
        import mediapipe as mp  # type: ignore[import-untyped]

        buf = np.frombuffer(image_bytes, dtype=np.uint8)
        bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if bgr is None:
            raise ValueError("Could not decode image bytes")
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        return mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    @staticmethod
    def _result_to_schema(result) -> PoseLandmarks:
        """Convert MediaPipe PoseLandmarkerResult → our PoseLandmarks schema."""
        norm_lms = result.pose_landmarks[0]
        world_lms = result.pose_world_landmarks[0] if result.pose_world_landmarks else None

        landmarks = [
            Landmark(
                x=lm.x,
                y=lm.y,
                z=lm.z,
                visibility=lm.visibility if hasattr(lm, "visibility") else 1.0,
            )
            for lm in norm_lms
        ]

        world_landmarks: list[Landmark] | None = None
        if world_lms:
            world_landmarks = [
                Landmark(
                    x=lm.x,
                    y=lm.y,
                    z=lm.z,
                    visibility=lm.visibility if hasattr(lm, "visibility") else 1.0,
                )
                for lm in world_lms
            ]

        return PoseLandmarks(
            landmarks=landmarks,
            world_landmarks=world_landmarks,
        )
