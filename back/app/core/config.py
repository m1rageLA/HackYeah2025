"""Configuration management for the FastAPI application."""

from functools import lru_cache

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        env_prefix="",
        extra="ignore",
    )

    app_name: str = "HackYeah2025 API"
    debug: bool = False
    api_port: int = 8000
    firebase_project_id: Optional[str] = None
    firebase_credentials_file: Optional[str] = None
    reports_collection: str = "reports"
    reports_backend: str = "firebase"

    def firebase_credentials_path(self) -> Optional[Path]:
        """Return absolute path to the Firebase service account file."""
        if not self.firebase_credentials_file:
            return None
        raw_path = Path(self.firebase_credentials_file).expanduser()
        if raw_path.is_absolute():
            return raw_path
        if raw_path.parts and raw_path.parts[0] == BASE_DIR.name:
            return (BASE_DIR.parent / raw_path).resolve()
        return (BASE_DIR / raw_path).resolve()



@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
