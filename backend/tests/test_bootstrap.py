import pytest

from app.bootstrap import get_ai_provider
from app.core.config import Settings
from app.core.errors import ProviderConfigError
from app.providers.cloudflare_flux import CloudflareFluxAdapter


def make_settings(**overrides: object) -> Settings:
    return Settings(_env_file=None, **overrides)  # pyright: ignore[reportCallIssue]


def test_get_ai_provider_builds_configured_cloudflare_adapter() -> None:
    config = make_settings(
        ai_provider="cloudflare_flux",
        ai_image_width=640,
        ai_image_height=768,
    )

    provider = get_ai_provider(config)

    assert isinstance(provider, CloudflareFluxAdapter)
    assert provider.width == 640
    assert provider.height == 768


def test_get_ai_provider_rejects_unknown_provider() -> None:
    config = make_settings(ai_provider="unknown")

    with pytest.raises(ProviderConfigError, match="Unsupported AI provider: unknown"):
        get_ai_provider(config)
