"""Protocol definitions for repository interfaces."""

from typing import List, Optional, Protocol

from ..schemas.report import Report, ReportCreate


class ReportRepository(Protocol):
    """Persistence operations for reports."""

    def create(self, payload: ReportCreate, reporter_id: Optional[str]) -> Report:
        """Persist a new report and return the stored representation."""
        ...

    def list(self) -> List[Report]:
        """Return all reports ordered by creation time descending."""
        ...
