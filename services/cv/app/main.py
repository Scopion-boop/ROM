"""ROM CV Worker — FastAPI application for pose estimation and ROM measurement."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import health, pipeline, capture

app = FastAPI(
    title="ROM CV Worker",
    description="Pose estimation and ROM angle measurement service",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restricted in production via env config
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
app.include_router(capture.router, prefix="/api/v1/capture", tags=["capture"])
