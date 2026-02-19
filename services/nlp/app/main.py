"""PhysioLens NLP Worker — FastAPI application for note summarization (V1.1)."""

from fastapi import FastAPI

app = FastAPI(
    title="PhysioLens NLP Worker",
    description="AI-assisted exam note summarization service (V1.1 scope)",
    version="0.1.0",
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Return service health status."""
    return {"status": "ok", "service": "physiolens-nlp-worker", "version": "0.1.0"}
