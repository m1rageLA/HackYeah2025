"""Firestore-backed repository for report statuses."""

from datetime import datetime
from typing import Optional

from google.cloud import firestore

from ..core.config import get_settings
from ..core.firebase import get_firestore_client
from ..schemas.report_status import ReportStatus, ReportStatusValue
from .protocols import ReportStatusRepository


def _snapshot_to_status(snapshot: firestore.DocumentSnapshot, fallback: Optional[datetime] = None) -> ReportStatus:
    data = snapshot.to_dict() or {}
    updated_at_raw = data.get("updated_at")
    updated_at = updated_at_raw if isinstance(updated_at_raw, datetime) else fallback or datetime.utcnow()
    status_value = data.get("status", ReportStatusValue.PENDING.value)
    try:
        status_enum = ReportStatusValue(status_value)
    except ValueError:
        status_enum = ReportStatusValue.PENDING
    return ReportStatus(
        report_id=snapshot.id,
        status=status_enum,
        updated_at=updated_at,
        updated_by=data.get("updated_by"),
    )


class FirebaseReportStatusRepository(ReportStatusRepository):
    """Firestore-backed persistence for report status changes."""

    def __init__(self, client: Optional[firestore.Client] = None, collection_name: Optional[str] = None) -> None:
        self._client = client
        self._collection_name = collection_name or get_settings().report_status_collection

    @property
    def client(self) -> firestore.Client:
        if self._client is None:
            self._client = get_firestore_client()
        return self._client

    @property
    def collection(self) -> firestore.CollectionReference:
        return self.client.collection(self._collection_name)

    def set_status(
        self,
        report_id: str,
        status: ReportStatusValue,
        *,
        supervisor_id: Optional[str],
        timestamp: datetime,
    ) -> ReportStatus:
        document_ref = self.collection.document(report_id)
        document_ref.set(
            {
                "status": status.value,
                "updated_at": timestamp,
                "updated_by": supervisor_id,
            }
        )
        snapshot = document_ref.get()
        if not snapshot.exists:
            raise RuntimeError("Failed to persist report status")
        return _snapshot_to_status(snapshot, fallback=timestamp)

    def get(self, report_id: str) -> Optional[ReportStatus]:
        snapshot = self.collection.document(report_id).get()
        if not snapshot.exists:
            return None
        return _snapshot_to_status(snapshot)
