"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .core.config import get_settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    application = FastAPI(title=settings.app_name, debug=settings.debug)
    application.include_router(api_router)
    
    application.add_middleware(
        CORSMiddleware,
            allow_origins=[
        "http://localhost:3000",  # your local frontend
        "https://civisafe.online",  # production
        "https://www.civisafe.online",
        "https://front-web-tan.vercel.app"
    ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return application


app = create_app()

@app.get("/", summary="Root API status")
def read_root() -> dict[str, str]:
    """Return a friendly confirmation that the API is running."""
    settings = get_settings()
    return {"message": f"Welcome to {settings.app_name}"}
