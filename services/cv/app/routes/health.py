"""Health check routes for the CV worker service."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def health_check() -> dict[str, str]:
    """Return service health status."""
    return {
        "status": "ok",
        "service": "rom-cv-worker",
        "version": "0.1.0",
    }


@router.get("/ready")
async def readiness_check() -> dict[str, bool]:
    """Return service readiness (model loaded, dependencies available)."""
    # TODO(cv-agent): verify model is loaded and inference is warm
    return {"ready": True}
