"""Configuration management for the FastAPI application."""

from functools import lru_cache
from os import getenv
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


_SERVICE_ACCOUNT_ENV_KEYS = (
    (("TYPE", "FIREBASE_TYPE"), "type"),
    (("PROJECT_ID", "FIREBASE_PROJECT_ID"), "project_id"),
    (("PROJECT_KEY_ID", "PRIVATE_KEY_ID", "FIREBASE_PRIVATE_KEY_ID"), "private_key_id"),
    (("PRIVATE_KEY", "FIREBASE_PRIVATE_KEY"), "private_key"),
    (("CLIENT_EMAIL", "FIREBASE_CLIENT_EMAIL"), "client_email"),
    (("CLIENT_ID", "FIREBASE_CLIENT_ID"), "client_id"),
    (("AUTH_URI", "FIREBASE_AUTH_URI"), "auth_uri"),
    (("TOKEN_URI", "FIREBASE_TOKEN_URI"), "token_uri"),
    (("AUTH_PROVIDER_X509_CERT_URL", "FIREBASE_AUTH_PROVIDER_X509_CERT_URL"), "auth_provider_x509_cert_url"),
    (("CLIENT_X509_CERT_URL", "FIREBASE_CLIENT_X509_CERT_URL"), "client_x509_cert_url"),
    (("UNIVERSE_DOMAIN", "FIREBASE_UNIVERSE_DOMAIN"), "universe_domain"),
)


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

        candidates: list[Path] = []
        candidates.append((BASE_DIR / raw_path).resolve())

        if raw_path.parts and raw_path.parts[0] == BASE_DIR.name:
            # Path like "back/secrets/..." while BASE_DIR is "back" locally.
            candidates.append((BASE_DIR.parent / raw_path).resolve())

        if raw_path.parts and raw_path.parts[0] != BASE_DIR.name and len(raw_path.parts) > 1:
            # Try stripping the first segment, useful when the service runs from /app.
            candidates.append((BASE_DIR / Path(*raw_path.parts[1:])).resolve())

        for candidate in candidates:
            if candidate.exists():
                return candidate

        # Fall back to the first candidate even if it does not exist so callers can emit a clear error.
        return candidates[0]

    def firebase_credentials_dict(self) -> Optional[dict[str, str]]:
        """Return service-account credentials built from env vars, if available."""
        data: dict[str, str] = {}
        for env_candidates, json_key in _SERVICE_ACCOUNT_ENV_KEYS:
            raw_value: Optional[str] = None
            for candidate in env_candidates:
                raw_value = getenv(candidate)
                if raw_value is not None:
                    break
            if raw_value is None:
                return None
            if json_key == "private_key":
                raw_value = raw_value.replace("\\n", "\n")
            data[json_key] = raw_value
        return data


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
