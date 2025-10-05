"""Firestore-backed repository for application users."""

from datetime import datetime
from typing import Iterable, Optional

from google.cloud import firestore

from ..core.config import get_settings
from ..core.firebase import get_firestore_client
from ..schemas.user import AppUser
from .protocols import UserRepository


def _ensure_datetime(value: object, fallback: datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    return fallback


def _snapshot_to_user(snapshot: firestore.DocumentSnapshot, fallback: Optional[datetime] = None) -> AppUser:
    data = snapshot.to_dict() or {}
    now = fallback or datetime.utcnow()
    created_at = _ensure_datetime(data.get("created_at"), now)
    last_seen_at = _ensure_datetime(data.get("last_seen_at"), now)
    reputation = data.get("reputation", 0)
    token_version = data.get("token_version", 1)
    phone_hash = data.get("phone_hash", snapshot.id)
    return AppUser(
        id=snapshot.id,
        phone_hash=phone_hash,
        reputation=int(reputation),
        created_at=created_at,
        last_seen_at=last_seen_at,
        token_version=int(token_version),
    )


class FirebaseUserRepository(UserRepository):
    """Firestore-backed persistence for application users."""

    def __init__(self, client: Optional[firestore.Client] = None, collection_name: Optional[str] = None) -> None:
        self._client = client
        self._collection_name = collection_name or get_settings().users_collection

    @property
    def client(self) -> firestore.Client:
        if self._client is None:
            self._client = get_firestore_client()
        return self._client

    @property
    def collection(self) -> firestore.CollectionReference:
        return self.client.collection(self._collection_name)

    def get(self, user_id: str) -> Optional[AppUser]:
        snapshot = self.collection.document(user_id).get()
        if not snapshot.exists:
            return None
        return _snapshot_to_user(snapshot)

    def get_many(self, user_ids: Iterable[str]) -> dict[str, AppUser]:
        results: dict[str, AppUser] = {}
        for user_id in user_ids:
            snapshot = self.collection.document(user_id).get()
            if snapshot.exists:
                results[user_id] = _snapshot_to_user(snapshot)
        return results

    def create(self, user_id: str, phone_hash: str, *, created_at: datetime, last_seen_at: datetime) -> AppUser:
        document_ref = self.collection.document(user_id)
        document_ref.set(
            {
                "phone_hash": phone_hash,
                "reputation": 0,
                "created_at": created_at,
                "last_seen_at": last_seen_at,
                "token_version": 1,
            }
        )
        snapshot = document_ref.get()
        if not snapshot.exists:
            raise RuntimeError("Failed to persist application user")
        return _snapshot_to_user(snapshot, fallback=created_at)

    def touch_last_seen(self, user_id: str, timestamp: datetime) -> AppUser:
        document_ref = self.collection.document(user_id)
        document_ref.set({"last_seen_at": timestamp}, merge=True)
        snapshot = document_ref.get()
        if not snapshot.exists:
            raise RuntimeError("User record missing while updating last-seen timestamp")
        return _snapshot_to_user(snapshot, fallback=timestamp)

    def adjust_reputation(self, user_id: str, delta: int) -> AppUser:
        document_ref = self.collection.document(user_id)
        document_ref.set({"reputation": firestore.Increment(delta)}, merge=True)
        snapshot = document_ref.get()
        if not snapshot.exists:
            raise RuntimeError("User record missing while adjusting reputation")
        return _snapshot_to_user(snapshot)

    def set_token_version(self, user_id: str, version: int) -> AppUser:
        document_ref = self.collection.document(user_id)
        document_ref.set({"token_version": int(version)}, merge=True)
        snapshot = document_ref.get()
        if not snapshot.exists:
            raise RuntimeError("User record missing while setting token version")
        return _snapshot_to_user(snapshot)
