"""Configuration management for the FastAPI application."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HackYeah2025 API"
    debug: bool = False

    # Allow the .env file while ignoring extra Firebase credentials injected at runtime.
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
