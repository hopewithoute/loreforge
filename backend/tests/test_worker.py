import asyncio

import fsspec
from sqlalchemy.orm import Session

from app.models.asset import AssetCategory, AssetCreate, AssetStyle
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
