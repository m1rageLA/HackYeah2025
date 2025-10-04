"""Report routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from ...schemas.report import Report, ReportCreate
from ...services import reports as reports_service
from ..deps.auth import get_optional_reporter_id, require_supervisor_identity

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=Report, status_code=status.HTTP_201_CREATED)
async def submit_report(
    payload: ReportCreate,
    reporter_id: Optional[str] = Depends(get_optional_reporter_id),
) -> Report:
    """Accept a new report from a user."""
    try:
        return await run_in_threadpool(reports_service.create_report, payload, reporter_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/", response_model=list[Report])
async def list_reports(
    _supervisor_id: str = Depends(require_supervisor_identity),
) -> list[Report]:
    """Return reports for supervisors."""
    try:
        return await run_in_threadpool(reports_service.list_reports)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
