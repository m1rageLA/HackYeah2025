"""Report service orchestrating repository operations."""

from functools import lru_cache
from typing import List, Optional

from ..core.config import get_settings
from ..repositories.firebase_reports import FirebaseReportRepository
from ..repositories.protocols import ReportRepository
from ..schemas.report import Report, ReportCreate


class ReportService:
    """High-level operations for report resources."""

    def __init__(self, repository: ReportRepository) -> None:
        self._repository = repository

    def create_report(self, payload: ReportCreate, user_id: Optional[str]) -> Report:
        """Persist a new report via the configured repository."""
        return self._repository.create(payload, user_id)

    def list_reports(self) -> List[Report]:
        """Fetch reports via the configured repository."""
        return self._repository.list()

    def get_report(self, report_id: str) -> Optional[Report]:
        """Return a single report if it exists."""
        return self._repository.get(report_id)


@lru_cache
def get_report_repository() -> ReportRepository:
    """Return the configured report repository implementation."""
    backend = get_settings().reports_backend.lower()
    if backend == "firebase":
        return FirebaseReportRepository()
    raise RuntimeError(f"Unsupported reports backend: {backend}")


@lru_cache
def get_report_service() -> ReportService:
    """Return a singleton report service instance."""
    return ReportService(get_report_repository())
