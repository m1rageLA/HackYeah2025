"""Service layer handling phone-based identity and JWT issuance."""

from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from functools import lru_cache

import jwt
import phonenumbers
from jwt import InvalidTokenError

from ..core.config import get_settings
from ..repositories.firebase_users import FirebaseUserRepository
from ..repositories.protocols import UserRepository
from ..schemas.auth import AuthPayload
from ..schemas.user import AppUser


class IdentityError(Exception):
    """Base exception for identity-related failures."""


class PhoneNormalizationError(IdentityError):
    """Raised when the provided phone number cannot be normalized."""


class TokenValidationError(IdentityError):
    """Raised when token decoding or validation fails."""


class IdentityService:
    """High-level operations for phone-based identity and reputation."""

    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    @property
    def settings(self):
        return get_settings()

    def normalize_phone(self, raw_phone: str) -> str:
        """Normalize the provided phone number into E.164 format."""
        try:
            parsed = phonenumbers.parse(raw_phone, self.settings.phone_default_region)
        except phonenumbers.NumberParseException as exc:
            raise PhoneNormalizationError(str(exc)) from exc

        if not phonenumbers.is_possible_number(parsed):
            raise PhoneNormalizationError("Phone number is not possible for the configured region")

        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

    def hash_phone(self, normalized_phone: str) -> str:
        """Hash the normalized phone number with an HMAC-SHA256 secret."""
        secret = self.settings.phone_hash_secret.encode("utf-8")
        digest = hmac.new(secret, normalized_phone.encode("utf-8"), hashlib.sha256)
        return digest.hexdigest()

    def _build_token(self, user: AppUser, issued_at: datetime) -> tuple[str, datetime]:
        expires_at = issued_at + timedelta(days=self.settings.jwt_expires_days)
        payload = {
            "sub": user.id,
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
            "tv": int(user.token_version),
        }
        token = jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)
        return token, expires_at

    def _ensure_user(self, user_id: str, phone_hash: str, *, timestamp: datetime) -> AppUser:
        existing = self._repository.get(user_id)
        if existing is not None:
            return self._repository.touch_last_seen(user_id, timestamp)
        return self._repository.create(user_id, phone_hash, created_at=timestamp, last_seen_at=timestamp)

    def authenticate_phone(self, raw_phone: str) -> AuthPayload:
        """Create or update a user based on the provided phone number and issue a JWT."""
        normalized = self.normalize_phone(raw_phone)
        phone_hash = self.hash_phone(normalized)
        issued_at = datetime.now(tz=timezone.utc)
        user = self._ensure_user(phone_hash, phone_hash, timestamp=issued_at)
        token, expires_at = self._build_token(user, issued_at)
        return AuthPayload(access_token=token, expires_at=expires_at, user=user)

    def verify_token(self, token: str) -> AppUser:
        """Validate an incoming token and return the associated user."""
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
                options={"require": ["sub", "iat", "exp"]},
            )
        except InvalidTokenError as exc:
            raise TokenValidationError("Token validation failed") from exc

        user_id = payload.get("sub")
        if not user_id:
            raise TokenValidationError("Token missing subject claim")

        token_version = int(payload.get("tv", 1))
        user = self._repository.get(user_id)
        if user is None:
            raise TokenValidationError("User not found for provided token")
        if int(user.token_version) != token_version:
            raise TokenValidationError("Token version no longer valid")

        refreshed = self._repository.touch_last_seen(user_id, datetime.now(tz=timezone.utc))
        return refreshed

    def adjust_reputation(self, user_id: str, delta: int) -> AppUser:
        """Adjust reputation score for the given user."""
        return self._repository.adjust_reputation(user_id, delta)

    def bump_token_version(self, user_id: str) -> AppUser:
        """Rotate the token version for a user, forcing re-authentication."""
        user = self._repository.get(user_id)
        if user is None:
            raise TokenValidationError("User not found for token rotation")
        return self._repository.set_token_version(user_id, user.token_version + 1)


@lru_cache
def get_user_repository() -> UserRepository:
    """Return the configured user repository implementation."""
    return FirebaseUserRepository()


@lru_cache
def get_identity_service() -> IdentityService:
    """Return a singleton identity service instance."""
    return IdentityService(get_user_repository())
