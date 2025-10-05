"""Authentication dependencies leveraging the identity service."""

from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from app.schemas.user import AppUser
from app.services.identity import IdentityService, TokenValidationError, get_identity_service


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    token = token.strip()
    return token


async def get_optional_user(
    authorization: Optional[str] = Header(default=None),
    service: IdentityService = Depends(get_identity_service),
) -> Optional[AppUser]:
    """Return the authenticated user if a valid token is supplied."""
    token = _extract_bearer_token(authorization)
    if token is None:
        return None
    try:
        return service.verify_token(token)
    except TokenValidationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


async def get_optional_reporter_id(
    authorization: Optional[str] = Header(default=None),
    service: IdentityService = Depends(get_identity_service),
) -> Optional[str]:
    """Return the reporter identifier derived from the JWT token if provided."""
    user = await get_optional_user(authorization=authorization, service=service)
    return user.id if user else None


async def require_current_user(
    authorization: Optional[str] = Header(default=None),
    service: IdentityService = Depends(get_identity_service),
) -> AppUser:
    """Enforce authentication and return the associated user."""
    user = await get_optional_user(authorization=authorization, service=service)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


async def require_supervisor_identity(authorization: Optional[str] = Header(default=None)) -> str:
    """Placeholder for supervisor authentication."""
    return authorization or "anonymous-supervisor"
