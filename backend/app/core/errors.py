from typing import ClassVar

from app.core.constants import ErrorCode


class DomainError(Exception):
    """Base class for all application domain errors."""


class ProviderError(DomainError):
    """Base class for AI Provider-related errors."""

    code: ClassVar[ErrorCode] = ErrorCode.INTERNAL_ERROR


class ProviderTimeoutError(ProviderError):
    """Raised when the provider takes too long to respond."""

    code = ErrorCode.AI_TIMEOUT


class ProviderConfigError(ProviderError):
    """Raised when the provider credentials or config (401/403) are invalid."""

    code = ErrorCode.PROVIDER_CONFIG_ERROR


class ProviderRateLimitError(ProviderError):
    """Raised when the provider rejects the request due to rate limits (429)."""

    code = ErrorCode.RATE_LIMITED


class ProviderBrokenResponseError(ProviderError):
    """Raised when the provider returns an empty, invalid, or malformed image payload."""

    code = ErrorCode.BROKEN_RESPONSE


class ProviderUnavailableError(ProviderError):
    """Raised when the provider encounters network errors or internal 5xx errors."""

    code = ErrorCode.PROVIDER_UNAVAILABLE
