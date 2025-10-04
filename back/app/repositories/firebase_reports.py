"""Firebase implementation of the report repository."""

from datetime import datetime
from typing import List, Optional

from google.cloud import firestore

from ..core.config import get_settings
from ..core.firebase import get_firestore_client
from ..schemas.report import GeoPoint, Report, ReportCreate
from .protocols import ReportRepository


def _serialize_geo_point(geo_point: Optional[GeoPoint]) -> Optional[firestore.GeoPoint]:
    if not geo_point:
        return None
    return firestore.GeoPoint(geo_point.latitude, geo_point.longitude)


def _deserialize_geo_point(value: object) -> Optional[GeoPoint]:
    if isinstance(value, firestore.GeoPoint):
        return GeoPoint(latitude=value.latitude, longitude=value.longitude)
    return None


def _snapshot_to_report(snapshot: firestore.DocumentSnapshot) -> Report:
    data = snapshot.to_dict() or {}
    created_at = data.get("created_at")
    if not isinstance(created_at, datetime):
        created_at = datetime.utcnow()
    updated_at = data.get("updated_at")
    if not isinstance(updated_at, datetime):
        updated_at = None
    return Report(
        id=snapshot.id,
        type=data.get("type", ""),
        data=data.get("data", {}),
        geo_point=_deserialize_geo_point(data.get("geo_point")),
        reporter_id=data.get("reporter_id"),
        created_at=created_at,
        updated_at=updated_at,
    )


class FirebaseReportRepository(ReportRepository):
    """Firestore-backed report persistence."""

    def __init__(self, client: Optional[firestore.Client] = None, collection_name: Optional[str] = None) -> None:
        self._client = client
        self._collection_name = collection_name or get_settings().reports_collection

    @property
    def client(self) -> firestore.Client:
        if self._client is None:
            self._client = get_firestore_client()
        return self._client

    def create(self, payload: ReportCreate, reporter_id: Optional[str]) -> Report:
        collection = self.client.collection(self._collection_name)
        document_ref = collection.document()
        document_ref.set(
            {
                "type": payload.type,
                "data": payload.data,
                "geo_point": _serialize_geo_point(payload.geo_point),
                "reporter_id": reporter_id,
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP,
            }
        )
        snapshot = document_ref.get()
        if not snapshot.exists:
            raise RuntimeError("Failed to persist report")
        return _snapshot_to_report(snapshot)

    def list(self) -> List[Report]:
        collection = self.client.collection(self._collection_name)
        query = collection.order_by("created_at", direction=firestore.Query.DESCENDING)
        snapshots = query.stream()
        return [_snapshot_to_report(snapshot) for snapshot in snapshots]
