"""Firebase client helpers."""

from functools import lru_cache
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

from .config import get_settings


@lru_cache
def _load_credentials() -> credentials.Certificate:
    settings = get_settings()
    credential_path = settings.firebase_credentials_path()
    if not credential_path or not credential_path.exists():
        raise RuntimeError(
            "Firebase credentials file is not configured. Set FIREBASE_CREDENTIALS_FILE in the environment."
        )
    return credentials.Certificate(str(credential_path))


def get_firebase_app() -> firebase_admin.App:
    """Return the initialized Firebase app instance."""
    try:
        return firebase_admin.get_app()
    except ValueError:
        settings = get_settings()
        cred = _load_credentials()
        options: Optional[dict[str, str]] = None
        if settings.firebase_project_id:
            options = {"projectId": settings.firebase_project_id}
        return firebase_admin.initialize_app(cred, options)


def get_firestore_client() -> firestore.Client:
    """Return a Firestore client bound to the Firebase app."""
    app = get_firebase_app()
    return firestore.client(app=app)
