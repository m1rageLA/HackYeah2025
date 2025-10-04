"""Report routes exposing submission and supervisor listing endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.api.dependencies import (
    get_optional_reporter_id,
    get_report_service,
    require_supervisor_identity,
)
from app.schemas.report import Report, ReportCreate
from app.services.reports import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post(
    "/",
    response_model=Report,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new report",
)
async def submit_report(
    payload: ReportCreate,
    reporter_id: Optional[str] = Depends(get_optional_reporter_id),
    service: ReportService = Depends(get_report_service),
) -> Report:
    try:
        return await run_in_threadpool(service.create_report, payload, reporter_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get(
    "/",
    response_model=list[Report],
    summary="List reports for supervisors",
)
async def list_reports(
    _supervisor_id: str = Depends(require_supervisor_identity),
    service: ReportService = Depends(get_report_service),
) -> list[Report]:
    try:
        return await run_in_threadpool(service.list_reports)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
