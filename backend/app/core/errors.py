class DomainError(Exception):
    """Base class for all application domain errors."""


class ProviderError(DomainError):
    """Base class for AI Provider-related errors."""


class ProviderTimeoutError(ProviderError):
    """Raised when the provider takes too long to respond."""


class ProviderConfigError(ProviderError):
    """Raised when the provider credentials or config (401/403) are invalid."""


class ProviderRateLimitError(ProviderError):
    """Raised when the provider rejects the request due to rate limits (429)."""


class ProviderBrokenResponseError(ProviderError):
    """Raised when the provider returns an empty, invalid, or malformed image payload."""


class ProviderUnavailableError(ProviderError):
    """Raised when the provider encounters network errors or internal 5xx errors."""
