from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_ROOT.parent
ENV_FILES = (REPO_ROOT / ".env", BACKEND_ROOT / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = "sqlite:///./data/loreforge.sqlite3"

    media_root: Path = Path("./data/media")
    media_url: str = "/media"

    ai_provider: str = "cloudflare_flux"
    ai_timeout_seconds: int = Field(default=60, gt=0)
    ai_image_width: int = Field(default=1024, gt=0)
    ai_image_height: int = Field(default=1024, gt=0)

    cloudflare_account_id: str = "replace_me"
    cloudflare_api_token: str = "replace_me"
    cloudflare_model: str = "@cf/black-forest-labs/flux-2-klein-4b"

    max_upload_mb: int = Field(default=5, gt=0)
    max_provider_reference_size: int = Field(default=511, gt=0, lt=512)

    frontend_dist: Path = Path("../frontend/dist")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
