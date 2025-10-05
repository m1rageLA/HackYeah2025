"""API router aggregation."""

from fastapi import APIRouter

from .routes import auth, health, reports

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(reports.router)

__all__ = ["api_router"]
