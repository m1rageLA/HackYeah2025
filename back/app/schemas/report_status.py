"""Schemas describing report status updates and persistence."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ReportStatusValue(str, Enum):
    """Allowed states for supervisor moderation of reports."""

    PENDING = "pending"
    APPROVED = "approved"
    INVALID = "invalid"


class ReportStatus(BaseModel):
    """Representation of the latest status of a report."""

    report_id: str = Field(..., description="Identifier of the moderated report.")
    status: ReportStatusValue = Field(..., description="Current moderation state for the report.")
    updated_at: datetime = Field(..., description="When the status was last updated.")
    updated_by: Optional[str] = Field(default=None, description="Identifier for the supervisor applying the status.")


class ReportStatusUpdate(BaseModel):
    """Payload supervisors send to change report status."""

    status: ReportStatusValue = Field(..., description="New moderation state to apply.")
