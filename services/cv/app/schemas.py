"""Schemas for the CV pipeline service."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Landmark(BaseModel):
    """A single pose landmark with 2D/3D coordinates and visibility."""

    x: float = Field(..., description="Normalized x coordinate [0, 1]")
    y: float = Field(..., description="Normalized y coordinate [0, 1]")
    z: float = Field(default=0.0, description="Depth coordinate (from MediaPipe world_landmarks)")
    visibility: float = Field(
        default=1.0, ge=0.0, le=1.0, description="Landmark visibility confidence"
    )


class MeasurementRequest(BaseModel):
    """Input payload for ROM measurement from pre-extracted landmarks."""

    joint: str = Field(..., description="Target joint (e.g., shoulder, elbow, knee)")
    movement: str = Field(..., description="Movement type (e.g., flexion, extension, abduction)")
    side: str = Field(..., pattern="^(left|right|midline)$", description="Body side")
    landmarks: list[Landmark] = Field(
        ..., min_length=3, description="Ordered landmarks: proximal, joint center, distal"
    )
    algorithm_version: str = Field(default="v1.0", description="Algorithm version identifier")
    use_3d: bool = Field(default=True, description="Whether to use 3D (x,y,z) angle computation")


class QualityFlag(BaseModel):
    """A quality flag for the measurement."""

    code: str = Field(..., description="Flag code (e.g., LOW_VISIBILITY, OCCLUSION)")
    message: str = Field(..., description="Human-readable description")
    severity: str = Field(default="warning", pattern="^(info|warning|error)$")


class MeasurementResponse(BaseModel):
    """Output payload from ROM measurement."""

    joint: str
    movement: str
    side: str
    rom_degrees: float = Field(..., description="Calculated ROM angle in degrees")
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in the measurement"
    )
    quality_flags: list[QualityFlag] = Field(default_factory=list)
    algorithm_version: str


# ─── Frame-based processing schemas ────────────────────────────────


class FrameRequest(BaseModel):
    """Input for processing a single image frame to extract pose and compute angles."""

    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG frame from camera")
    joints: list[str] = Field(
        default_factory=list,
        description="Joints to measure. Empty = detect all visible joints.",
    )
    movements: list[str] = Field(
        default_factory=list,
        description="Movements to measure (paired with joints). Same length as joints.",
    )
    sides: list[str] = Field(
        default_factory=list,
        description="Sides to measure (paired with joints). Same length as joints.",
    )
    algorithm_version: str = Field(default="v1.0")


class PoseLandmarks(BaseModel):
    """Full set of 33 MediaPipe pose landmarks from a single frame."""

    landmarks: list[Landmark] = Field(
        ..., min_length=33, max_length=33, description="All 33 MediaPipe pose landmarks"
    )
    world_landmarks: list[Landmark] = Field(
        default_factory=list,
        description="33 MediaPipe world landmarks (real-world 3D coordinates in meters)",
    )


class FrameMeasurement(BaseModel):
    """A single joint measurement extracted from a frame."""

    joint: str
    movement: str
    side: str
    rom_degrees: float
    confidence_score: float
    quality_flags: list[QualityFlag] = Field(default_factory=list)


class FrameResponse(BaseModel):
    """Output from processing a single frame."""

    measurements: list[FrameMeasurement] = Field(default_factory=list)
    pose_landmarks: PoseLandmarks | None = None
    frame_quality: str = Field(
        default="good", description="Overall frame quality: good, degraded, unusable"
    )
    algorithm_version: str = Field(default="v1.0")


# ─── Streaming protocol messages ───────────────────────────────────


class StreamConfig(BaseModel):
    """Configuration sent at the start of a WebSocket streaming session."""

    joints: list[str] = Field(..., description="Joints to track during this stream")
    movements: list[str] = Field(..., description="Movements to measure")
    sides: list[str] = Field(..., description="Body sides")
    fps_target: int = Field(default=15, ge=1, le=30)
    temporal_window: int = Field(
        default=10, ge=3, le=30,
        description="Number of frames for temporal smoothing",
    )
    auto_capture_threshold_degrees: float = Field(
        default=2.0, ge=0.5, le=5.0,
        description="Angle stability threshold for auto-capture (±degrees)",
    )
    auto_capture_hold_ms: int = Field(
        default=800, ge=300, le=3000,
        description="How long angle must be stable before auto-capture (ms)",
    )
    algorithm_version: str = Field(default="v1.0")


class StreamFrame(BaseModel):
    """A single frame in a streaming session."""

    frame_index: int
    image_base64: str


class StreamMeasurement(BaseModel):
    """Real-time measurement update sent back over the WebSocket."""

    frame_index: int
    joint: str
    movement: str
    side: str
    rom_degrees: float
    smoothed_rom_degrees: float = Field(
        ..., description="Temporally smoothed angle (median of sliding window)"
    )
    confidence_score: float
    quality_flags: list[QualityFlag] = Field(default_factory=list)
    is_stable: bool = Field(
        default=False, description="True when angle has stabilized within threshold"
    )
    stable_for_ms: int = Field(
        default=0, description="How long the angle has been stable (ms)"
    )
    auto_captured: bool = Field(
        default=False, description="True if this reading was auto-captured due to stability"
    )
    algorithm_version: str = Field(
        default="v1.0", description="Algorithm version + method suffix"
    )


class StreamResponse(BaseModel):
    """Complete WebSocket response frame — measurements + optional landmarks."""

    frame_index: int
    measurements: list[StreamMeasurement] = Field(default_factory=list)
    pose_landmarks: list[Landmark] | None = Field(
        default=None,
        description="33 normalised MediaPipe landmarks for skeleton overlay rendering",
    )
    error: str | None = None


# ─── Calibration schemas ───────────────────────────────────────────


class CalibrationRequest(BaseModel):
    """Request to capture a neutral standing baseline for ROM zero-reference."""

    image_base64: str = Field(
        ..., description="Base64-encoded image of patient in neutral standing pose"
    )
    session_id: str = Field(
        ..., description="Session identifier — calibration is stored per session"
    )


class CalibrationBaseline(BaseModel):
    """Per-joint baseline angles captured during calibration."""

    joint: str
    movement: str
    side: str
    baseline_degrees: float = Field(
        ..., description="Resting angle in neutral standing position"
    )
    confidence_score: float


class CalibrationResponse(BaseModel):
    """Response from calibration capture."""

    session_id: str
    baselines: list[CalibrationBaseline] = Field(default_factory=list)
    pose_landmarks: PoseLandmarks | None = None
    quality: str = Field(
        default="good", description="Overall calibration quality: good, degraded, unusable"
    )

