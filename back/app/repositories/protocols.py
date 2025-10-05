"""Protocol definitions for repository interfaces."""

from datetime import datetime
from typing import Iterable, List, Optional, Protocol

from ..schemas.report import Report, ReportCreate
from ..schemas.report_status import ReportStatus, ReportStatusValue
from ..schemas.user import AppUser


class ReportRepository(Protocol):
    """Persistence operations for reports."""

    def create(self, payload: ReportCreate, user_id: Optional[str]) -> Report:
        """Persist a new report and return the stored representation."""
        ...

    def list(self) -> List[Report]:
        """Return all reports ordered by creation time descending."""
        ...

    def get(self, report_id: str) -> Optional[Report]:
        """Retrieve a single report by its identifier."""
        ...


class ReportStatusRepository(Protocol):
    """Persistence operations for report status updates."""

    def set_status(
        self,
        report_id: str,
        status: ReportStatusValue,
        *,
        supervisor_id: Optional[str],
        timestamp: datetime,
    ) -> ReportStatus:
        """Persist the new status and return the stored representation."""
        ...

    def get(self, report_id: str) -> Optional[ReportStatus]:
        """Return the latest status for the report if it exists."""
        ...


class UserRepository(Protocol):
    """Persistence operations for application users."""

    def get(self, user_id: str) -> Optional[AppUser]:
        """Return the user by identifier if it exists."""
        ...

    def get_many(self, user_ids: Iterable[str]) -> dict[str, AppUser]:
        """Return users indexed by id for the provided identifiers."""
        ...

    def create(self, user_id: str, phone_hash: str, *, created_at: datetime, last_seen_at: datetime) -> AppUser:
        """Create and return a new user entry."""
        ...

    def touch_last_seen(self, user_id: str, timestamp: datetime) -> AppUser:
        """Update and return the user after refreshing the last-seen timestamp."""
        ...

    def adjust_reputation(self, user_id: str, delta: int) -> AppUser:
        """Apply a signed delta to the user reputation and return the updated state."""
        ...

    def set_token_version(self, user_id: str, version: int) -> AppUser:
        """Persist a new token version on the user for global token invalidation."""
        ...
