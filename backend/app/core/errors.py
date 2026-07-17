from enum import StrEnum
from typing import ClassVar


class ErrorCode(StrEnum):
    INTERNAL_ERROR = "INTERNAL_ERROR"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    UPLOAD_TOO_LARGE = "UPLOAD_TOO_LARGE"
    AI_TIMEOUT = "AI_TIMEOUT"
    BROKEN_RESPONSE = "BROKEN_RESPONSE"
    PROVIDER_CONFIG_ERROR = "PROVIDER_CONFIG_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    INVALID_PROMPT = "INVALID_PROMPT"


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


class ProviderInvalidPromptError(ProviderError):
    """Raised when the provider rejects the prompt as invalid or flagged."""

    code = ErrorCode.INVALID_PROMPT
