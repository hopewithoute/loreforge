import asyncio
import contextlib
import logging
import uuid
from typing import cast

import fsspec

from app.bootstrap import get_ai_provider, get_storage_driver
from app.core.errors import ErrorCode, ProviderError
from app.db.database import SessionLocal
from app.models.asset import AssetStatus
from app.providers.base import AIProvider
from app.services.asset_service import AssetService
from app.services.prompt_builder import build_prompt

logger = logging.getLogger(__name__)


def generate_image_task(asset_id: str, user_id: str) -> None:
    """
    FastAPI BackgroundTask entrypoint.

    Architectural note: We explicitly open a fresh, isolated DB session here.
    If we reused the request's DB session, this long-running (10-30s) task
    would hold the connection open, quickly exhausting the connection pool
    under concurrent load. This ensures the web thread completes instantly.

    We also instantiate fresh `storage` and `provider` objects. Passing complex
    objects (like httpx.AsyncClient inside the provider) across threads can
    cause event-loop attachment errors. Fresh instantiation guarantees thread-safety.
    """
    # Create concrete instances using central factories to prevent drift
    storage = get_storage_driver()
    provider = get_ai_provider()

    # Open isolated DB session
    with SessionLocal() as db:
        service = AssetService(db, storage)
        asyncio.run(_process_generation(asset_id, user_id, service, storage, provider))


async def _process_generation(
    asset_id: str,
    user_id: str,
    service: AssetService,
    storage: fsspec.AbstractFileSystem,
    provider: AIProvider,
) -> None:
    """
    Core business logic for background generation.

    By accepting ONLY interfaces (AbstractFileSystem, AIProvider) and the
    Service layer, this function is completely decoupled from concrete
    implementations like local disk or Cloudflare. This makes it trivially
    easy to unit test using mocks without hitting real infrastructure.
    """
    logger.info(f"Starting background generation for Asset: {asset_id}")

    asset = service.get_asset(asset_id, user_id)
    # Guard condition: check existence of asset
    if not asset:
        logger.warning(f"Worker cannot find asset {asset_id}. Exiting.")
        return

    # Guard condition: only process pending requests
    if asset.status != AssetStatus.pending.value:
        logger.info(f"Asset {asset_id} is no longer pending. Exiting.")
        return

    try:
        # 1. Prepare inputs
        reference_images: list[bytes] = []
        is_evolve_mode = False
        if asset.prepared_input_path:
            # If there's a prepared input but no original reference, it came from Evolve
            if not asset.reference_image_path:
                is_evolve_mode = True

                # The asset was prepared in AssetService.evolve_asset, where the parent's
                # generated image was converted and saved to this asset's prepared_input_path.
                # We only need this ONE image to forge the next evolutionary step.
                try:
                    img_bytes = cast(bytes, storage.cat_file(asset.prepared_input_path))
                    reference_images.append(img_bytes)
                except FileNotFoundError:
                    pass
            else:
                # It came from a user sketch (Create/Regenerate)
                img_bytes = cast(bytes, storage.cat_file(asset.prepared_input_path))
                reference_images.append(img_bytes)

        prompt = build_prompt(
            asset.category,
            asset.style,
            asset.prompt,
            has_reference=bool(reference_images),
            is_evolve=is_evolve_mode,
        )

        # 2. Generate Image
        result = await provider.generate(
            prompt=prompt,
            reference_image_bytes=reference_images if reference_images else None,
            seed=asset.seed,
        )

        # 3. Save Image to a distinct output filename
        output_filename = f"generated_{uuid.uuid4().hex}{result.extension.value}"
        final_path = f"assets/{asset_id}/{output_filename}"
        storage.pipe_file(final_path, result.image_bytes)

        # 4. Mark success atomically
        # Relies on the atomic UPDATE in AssetService to prevent race conditions
        # (e.g., if a server restart spawned a duplicate worker for this asset).
        updated_asset = service.mark_as_success(
            asset_id=asset_id,
            user_id=user_id,
            generated_image_path=final_path,
            provider_name=result.provider_name,
            provider_model=result.provider_model,
            seed=result.seed,
        )

        if not updated_asset:
            # If rowcount was 0 during the atomic update, another worker beat us to it.
            # We discard the duplicate image we just generated to save space.
            logger.info(f"Asset {asset_id} was already completed. Discarding output {final_path}.")
            with contextlib.suppress(FileNotFoundError):
                storage.rm(final_path)
        else:
            logger.info(f"Successfully generated and saved asset {asset_id} at {final_path}.")

    except ProviderError as e:
        logger.error(f"Provider error for asset {asset_id}: {e}")
        service.mark_as_failed(asset_id, user_id, e.code, str(e))
    except Exception as e:
        logger.exception(f"Unexpected error generating asset {asset_id}: {e}")
        service.mark_as_failed(
            asset_id, user_id, ErrorCode.INTERNAL_ERROR, "An unexpected error occurred."
        )
