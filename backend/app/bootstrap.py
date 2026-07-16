import fsspec
from fsspec.implementations.dirfs import DirFileSystem

from app.core.config import Settings, settings
from app.core.errors import ProviderConfigError
from app.providers.base import AIProvider
from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.providers.mock import MockAIProvider


def create_storage_driver(config: Settings) -> fsspec.AbstractFileSystem:
    local_fs = fsspec.filesystem("file", auto_mkdir=True)
    return DirFileSystem(path=str(config.media_root), fs=local_fs)


def get_storage_driver() -> fsspec.AbstractFileSystem:
    return create_storage_driver(settings)


def create_ai_provider(config: Settings) -> AIProvider:
    if config.ai_provider == "cloudflare_flux":
        return CloudflareFluxAdapter(config)
    elif config.ai_provider.startswith("mock_"):
        mode = config.ai_provider.replace("mock_", "")
        return MockAIProvider(mode=mode)
    raise ProviderConfigError(f"Unsupported AI provider: {config.ai_provider}")


def get_ai_provider() -> AIProvider:
    return create_ai_provider(settings)
