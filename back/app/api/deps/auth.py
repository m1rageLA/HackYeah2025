"""Authentication dependency placeholders."""

from typing import Optional

from fastapi import Header


async def get_optional_reporter_id(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    """Return reporter identifier once auth is implemented."""
    return None


async def require_supervisor_identity(authorization: Optional[str] = Header(default=None)) -> str:
    """Placeholder for supervisor authentication."""
    return authorization or "anonymous-supervisor"
