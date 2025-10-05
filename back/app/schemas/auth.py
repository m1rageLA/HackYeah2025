"""Pydantic models describing authentication payloads."""

from datetime import datetime

from pydantic import BaseModel, Field

from .user import AppUser


class PhoneLoginRequest(BaseModel):
    """Request payload carrying the raw phone number to authenticate."""

    phone_number: str = Field(..., min_length=4, max_length=32, description="Phone number provided by the user.")


class AuthPayload(BaseModel):
    """Response payload returned after successful phone-based authentication."""

    access_token: str = Field(..., description="Signed JWT granting access to authenticated endpoints.")
    token_type: str = Field(default="bearer", description="OAuth-compatible token type identifier.")
    expires_at: datetime = Field(..., description="UTC datetime when the token expires.")
    user: AppUser = Field(..., description="User context associated with the issued token.")
