"""FastAPI application entrypoint."""

from fastapi import FastAPI

from .api import api_router
from .core.config import get_settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    application = FastAPI(title=settings.app_name, debug=settings.debug)
    application.include_router(api_router)
    return application


app = create_app()


@app.get("/", summary="Root API status")
def read_root() -> dict[str, str]:
    """Return a friendly confirmation that the API is running."""
    settings = get_settings()
    return {"message": f"Welcome to {settings.app_name}"}
