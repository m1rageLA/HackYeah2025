"""Pydantic models describing application users."""

from datetime import datetime

from pydantic import BaseModel, Field


class AppUser(BaseModel):
    """Minimal representation of an application user."""

    id: str = Field(..., description="Stable user identifier derived from the normalized phone number hash.")
    phone_hash: str = Field(..., description="HMAC-SHA256 hash of the normalized phone number.")
    reputation: int = Field(default=0, description="Reputation score accumulated by validated contributions.")
    created_at: datetime = Field(..., description="Timestamp when the user profile was first created.")
    last_seen_at: datetime = Field(..., description="Timestamp when the user last presented a valid token.")
    token_version: int = Field(default=1, ge=1, description="Token version allowing explicit invalidation of long-lived tokens.")
