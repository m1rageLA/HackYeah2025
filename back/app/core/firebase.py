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
    if credential_path and credential_path.exists():
        return credentials.Certificate(str(credential_path))

    credential_dict = settings.firebase_credentials_dict()
    if credential_dict:
        return credentials.Certificate(credential_dict)

    raise RuntimeError(
        "Firebase credentials are not configured. Provide FIREBASE_CREDENTIALS_FILE or the individual service-account fields."
    )



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
