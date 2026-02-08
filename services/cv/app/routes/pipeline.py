"""Pipeline routes for ROM angle measurement from pose landmarks."""

from fastapi import APIRouter

from ..schemas import MeasurementRequest, MeasurementResponse
from ..pipeline import compute_rom_angle

router = APIRouter()


@router.post("/measure", response_model=MeasurementResponse)
async def measure_rom(request: MeasurementRequest) -> MeasurementResponse:
    """Accept pose landmarks and return ROM angle measurement."""
    return compute_rom_angle(request)
