"""Schemas for the CV pipeline service."""

from pydantic import BaseModel, Field


class Landmark(BaseModel):
    """A single pose landmark with 2D/3D coordinates and visibility."""

    x: float = Field(..., description="Normalized x coordinate [0, 1]")
    y: float = Field(..., description="Normalized y coordinate [0, 1]")
    z: float = Field(default=0.0, description="Depth coordinate (optional)")
    visibility: float = Field(
        default=1.0, ge=0.0, le=1.0, description="Landmark visibility confidence"
    )


class MeasurementRequest(BaseModel):
    """Input payload for ROM measurement."""

    joint: str = Field(..., description="Target joint (e.g., shoulder, elbow, knee)")
    movement: str = Field(..., description="Movement type (e.g., flexion, extension, abduction)")
    side: str = Field(..., pattern="^(left|right)$", description="Body side")
    landmarks: list[Landmark] = Field(
        ..., min_length=3, description="Ordered landmarks: proximal, joint center, distal"
    )
    algorithm_version: str = Field(default="v1.0", description="Algorithm version identifier")


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
