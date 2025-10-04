"""Report service orchestrating repository operations."""

from functools import lru_cache
from typing import List, Optional

from ..core.config import get_settings
from ..repositories.firebase_reports import FirebaseReportRepository
from ..repositories.protocols import ReportRepository
from ..schemas.report import Report, ReportCreate


@lru_cache
def get_report_repository() -> ReportRepository:
    """Return the configured report repository implementation."""
    backend = get_settings().reports_backend.lower()
    if backend == "firebase":
        return FirebaseReportRepository()
    raise RuntimeError(f"Unsupported reports backend: {backend}")


def create_report(payload: ReportCreate, reporter_id: Optional[str]) -> Report:
    """Persist a new report via the configured repository."""
    repository = get_report_repository()
    return repository.create(payload, reporter_id)


def list_reports() -> List[Report]:
    """Fetch reports via the configured repository."""
    repository = get_report_repository()
    return repository.list()
