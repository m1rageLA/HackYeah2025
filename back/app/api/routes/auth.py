"""Authentication routes providing lightweight phone login."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.auth import AuthPayload, PhoneLoginRequest
from app.services.identity import IdentityService, PhoneNormalizationError, get_identity_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/phone",
    response_model=AuthPayload,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user by phone number",
)
async def authenticate_phone(
    payload: PhoneLoginRequest,
    service: IdentityService = Depends(get_identity_service),
) -> AuthPayload:
    """Normalize and hash the provided phone number, creating a user if needed, then issue a JWT."""
    try:
        return service.authenticate_phone(payload.phone_number)
    except PhoneNormalizationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
