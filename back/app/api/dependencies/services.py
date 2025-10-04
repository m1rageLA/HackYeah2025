"""Service dependency providers."""

from app.services.reports import ReportService, get_report_service as _get_report_service


def get_report_service() -> ReportService:
    """Return the report service instance for dependency injection."""
    return _get_report_service()
