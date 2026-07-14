import asyncio
import re

import fsspec
import pytest
from sqlalchemy.orm import Session

from app.core.constants import ErrorCode
from app.core.errors import (
    ProviderBrokenResponseError,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)
from app.models.asset import AssetCategory, AssetCreate, AssetStyle
from app.providers.base import GeneratedImageExtension, GeneratedImageResult
from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.services.asset_service import AssetService
from app.workers.image_worker import _process_generation


def test_worker_success(db_session: Session):
    # Setup
    storage = fsspec.filesystem("memory")
    service = AssetService(db_session, storage)
    provider = CloudflareFluxAdapter()

    # Create pending asset
    data = AssetCreate(
        prompt="test worker", category=AssetCategory.environment, style=AssetStyle.concept_art
    )
    asset = service.create_asset("user-worker", data)
    db_session.commit()

    # Execute worker logic
    asyncio.run(_process_generation(asset.id, "user-worker", service, storage, provider))

    # Verify success
    updated_asset = service.get_asset(asset.id, "user-worker")
    assert updated_asset is not None
    assert updated_asset.status == "success"
    assert updated_asset.generated_image_path is not None
    assert updated_asset.provider_name == "cloudflare"


def test_worker_preserves_provider_output_extension(db_session: Session) -> None:
    image_bytes = b"jpeg-output"

    class JpegProvider:
        async def generate(self, *args, **kwargs):
            return GeneratedImageResult(
                image_bytes=image_bytes,
                extension=GeneratedImageExtension.JPEG,
                provider_name="test",
                provider_model="test-model",
            )

    storage = fsspec.filesystem("memory")
    service = AssetService(db_session, storage)
    asset = service.create_asset(
        "user-worker",
        AssetCreate(
            prompt="test jpeg",
            category=AssetCategory.environment,
            style=AssetStyle.concept_art,
        ),
    )

    asyncio.run(_process_generation(asset.id, "user-worker", service, storage, JpegProvider()))

    updated_asset = service.get_asset(asset.id, "user-worker")
    assert updated_asset is not None
    assert updated_asset.generated_image_path is not None
    assert re.fullmatch(
        rf"assets/{asset.id}/generated_[0-9a-f]{{32}}\.jpg",
        updated_asset.generated_image_path,
    )
    assert storage.cat_file(updated_asset.generated_image_path) == image_bytes


@pytest.mark.parametrize(
    ("provider_error", "expected_code"),
    [
        (ProviderTimeoutError("timeout"), ErrorCode.AI_TIMEOUT),
        (ProviderBrokenResponseError("broken"), ErrorCode.BROKEN_RESPONSE),
        (ProviderConfigError("config"), ErrorCode.PROVIDER_CONFIG_ERROR),
        (ProviderRateLimitError("rate limit"), ErrorCode.RATE_LIMITED),
        (ProviderUnavailableError("unavailable"), ErrorCode.PROVIDER_UNAVAILABLE),
    ],
)
def test_worker_persists_canonical_provider_error(
    db_session: Session,
    provider_error: ProviderError,
    expected_code: ErrorCode,
) -> None:
    class FailingProvider:
        async def generate(self, *args, **kwargs):
            raise provider_error

    storage = fsspec.filesystem("memory")
    service = AssetService(db_session, storage)
    asset = service.create_asset(
        "user-worker",
        AssetCreate(
            prompt="test failure",
            category=AssetCategory.environment,
            style=AssetStyle.concept_art,
        ),
    )

    asyncio.run(_process_generation(asset.id, "user-worker", service, storage, FailingProvider()))

    updated_asset = service.get_asset(asset.id, "user-worker")
    assert updated_asset is not None
    assert updated_asset.status == "failed"
    assert updated_asset.error_code == expected_code
