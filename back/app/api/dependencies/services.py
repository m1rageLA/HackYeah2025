"""Service dependency providers."""

from app.services.report_status import (
    ReportStatusService,
    get_report_status_service as _get_report_status_service,
)
from app.services.reports import ReportService, get_report_service as _get_report_service


def get_report_service() -> ReportService:
    """Return the report service instance for dependency injection."""
    return _get_report_service()


def get_report_status_service() -> ReportStatusService:
    """Return the report status service instance for dependency injection."""
    return _get_report_status_service()
