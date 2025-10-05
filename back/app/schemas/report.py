"""Pydantic models for report resources."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from .report_status import ReportStatus


class GeoPoint(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class ReportCreate(BaseModel):
    type: str = Field(..., min_length=1)
    data: dict[str, Any] = Field(default_factory=dict)
    geo_point: Optional[GeoPoint] = None


class Report(BaseModel):
    id: str
    type: str
    data: dict[str, Any]
    geo_point: Optional[GeoPoint] = None
    user_id: Optional[str] = None
    status: Optional[ReportStatus] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True
