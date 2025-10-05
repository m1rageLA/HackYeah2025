"""Report routes exposing submission and supervisor listing endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.api.dependencies import (
    get_optional_reporter_id,
    get_report_service,
    get_report_status_service,
    require_supervisor_identity,
)
from app.schemas.report import Report, ReportCreate
from app.schemas.report_status import ReportStatus, ReportStatusUpdate
from app.schemas.user import AppUser
from app.services.identity import IdentityService, get_identity_service
from app.services.report_status import ReportStatusService
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
    user_id: Optional[str] = Depends(get_optional_reporter_id),
    service: ReportService = Depends(get_report_service),
) -> Report:
    try:
        return await run_in_threadpool(service.create_report, payload, user_id)
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
    status_service: ReportStatusService = Depends(get_report_status_service),
    identity_service: IdentityService = Depends(get_identity_service),
) -> list[Report]:
    try:
        reports = await run_in_threadpool(service.list_reports)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    if not reports:
        return []

    try:
        status_map = await run_in_threadpool(status_service.get_status_map, [report.id for report in reports])
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    user_ids = {report.user_id for report in reports if report.user_id}
    users_map: dict[str, AppUser] = {}
    if user_ids:
        try:
            users_map = await run_in_threadpool(identity_service.get_users_map, tuple(user_ids))
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    enriched: list[Report] = []
    for report in reports:
        user = users_map.get(report.user_id) if report.user_id else None
        enriched.append(
            report.copy(
                update={"status": status_map.get(report.id), "user_reputation": user.reputation if user else None}
            )
        )
    return enriched


@router.patch(
    "/{report_id}/status",
    response_model=ReportStatus,
    summary="Update report moderation status",
)
async def update_report_status(
    report_id: str,
    payload: ReportStatusUpdate,
    supervisor_id: str = Depends(require_supervisor_identity),
    service: ReportStatusService = Depends(get_report_status_service),
) -> ReportStatus:
    try:
        return await run_in_threadpool(service.set_status, report_id, payload.status, supervisor_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get(
    "/{report_id}/status",
    response_model=ReportStatus,
    summary="Fetch the latest report status",
)
async def get_report_status(
    report_id: str,
    _supervisor_id: str = Depends(require_supervisor_identity),
    service: ReportStatusService = Depends(get_report_status_service),
) -> ReportStatus:
    try:
        status_obj = await run_in_threadpool(service.get_status, report_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    if status_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report status not found")
    return status_obj
