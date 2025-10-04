"""Health check route for the API."""

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", summary="Service health status")
def health_check() -> dict[str, str]:
    """Return a simple health response."""
    return {"status": "ok"}
