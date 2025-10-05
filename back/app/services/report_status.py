"""Service orchestrating report status moderation and reputation changes."""

from datetime import datetime, timezone
from functools import lru_cache
from typing import Optional

from ..repositories.firebase_report_status import FirebaseReportStatusRepository
from ..repositories.protocols import ReportRepository, ReportStatusRepository
from ..schemas.report_status import ReportStatus, ReportStatusValue
from .identity import IdentityService, get_identity_service

from .reports import get_report_repository

_STATUS_REPUTATION_SCORES: dict[ReportStatusValue, int] = {
    ReportStatusValue.PENDING: 0,
    ReportStatusValue.APPROVED: 1,
    ReportStatusValue.INVALID: -1,
}


class ReportStatusService:
    """High-level operations for supervisor moderation of reports."""

    def __init__(
        self,
        status_repository: ReportStatusRepository,
        report_repository: ReportRepository,
        identity_service: IdentityService,
    ) -> None:
        self._status_repository = status_repository
        self._report_repository = report_repository
        self._identity_service = identity_service

    def set_status(self, report_id: str, status: ReportStatusValue, supervisor_id: Optional[str]) -> ReportStatus:
        report = self._report_repository.get(report_id)
        if report is None:
            raise ValueError(f"Report with id {report_id} was not found")

        timestamp = datetime.now(tz=timezone.utc)
        previous = self._status_repository.get(report_id)
        stored = self._status_repository.set_status(
            report_id,
            status,
            supervisor_id=supervisor_id,
            timestamp=timestamp,
        )

        previous_score = _STATUS_REPUTATION_SCORES[previous.status] if previous else _STATUS_REPUTATION_SCORES[ReportStatusValue.PENDING]
        new_score = _STATUS_REPUTATION_SCORES[status]
        delta = new_score - previous_score
        if delta != 0 and report.user_id:
            self._identity_service.adjust_reputation(report.user_id, delta)

        return stored

    def get_status(self, report_id: str) -> Optional[ReportStatus]:
        return self._status_repository.get(report_id)


@lru_cache
def get_report_status_repository() -> ReportStatusRepository:
    """Return the configured report status repository implementation."""
    return FirebaseReportStatusRepository()


@lru_cache
def get_report_status_service() -> ReportStatusService:
    """Return a singleton report status service instance."""
    return ReportStatusService(
        status_repository=get_report_status_repository(),
        report_repository=get_report_repository(),
        identity_service=get_identity_service(),
    )
