import fsspec
from fsspec.implementations.dirfs import DirFileSystem

from app.core.config import Settings, settings
from app.core.errors import ProviderConfigError
from app.providers.base import AIProvider
from app.providers.cloudflare_flux import CloudflareFluxAdapter


def get_storage_driver(config: Settings | None = None) -> fsspec.AbstractFileSystem:
    runtime = config or settings
    local_fs = fsspec.filesystem("file", auto_mkdir=True)
    return DirFileSystem(path=str(runtime.media_root), fs=local_fs)


def get_ai_provider(config: Settings | None = None) -> AIProvider:
    runtime = config or settings
    if runtime.ai_provider == "cloudflare_flux":
        return CloudflareFluxAdapter(runtime)
    raise ProviderConfigError(f"Unsupported AI provider: {runtime.ai_provider}")
