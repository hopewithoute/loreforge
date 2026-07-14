import asyncio
import logging
import uuid

from app.api.deps import get_ai_provider, get_storage_driver
from app.core.constants import ErrorCode
from app.core.errors import ProviderError
from app.db.database import SessionLocal
from app.models.asset import AssetStatus
from app.providers.base import AIProvider
from app.services.asset_service import AssetService
from app.services.prompt_builder import build_prompt
from app.storage.base import StorageDriver

logger = logging.getLogger(__name__)


def generate_image_task(asset_id: str, user_id: str) -> None:
    """
    FastAPI BackgroundTask entrypoint.
    Creates concrete dependencies and starts a fresh DB session.
    Because this is a synchronous function, FastAPI runs it in a threadpool,
    preventing DB/Storage synchronous I/O from blocking the main event loop.
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
    storage: StorageDriver,
    provider: AIProvider,
) -> None:
    """
    Core business logic for background generation using ONLY interfaces (Protocols).
    """
    logger.info(f"Starting background generation for Asset: {asset_id}")

    asset = service.get_asset(asset_id, user_id)
    if not asset:
        logger.warning(f"Worker cannot find asset {asset_id}. Exiting.")
        return

    # Guard condition: only process pending requests
    if asset.status != AssetStatus.pending.value:
        logger.info(f"Asset {asset_id} is no longer pending. Exiting.")
        return

    try:
        # 1. Prepare inputs
        prompt = build_prompt(asset.category, asset.style, asset.prompt)

        reference_bytes = None
        if asset.prepared_input_path:
            reference_bytes = storage.read(asset.prepared_input_path)

        # 2. Generate Image
        result = await provider.generate(
            prompt=prompt,
            reference_image_bytes=reference_bytes,
        )

        # 3. Save Image to a temporary distinct filename
        temp_filename = f"generated_{uuid.uuid4().hex[:8]}.png"
        final_path = storage.save(asset_id, temp_filename, result.image_bytes)

        # 4. Mark success atomically
        updated_asset = service.mark_as_success(
            asset_id=asset_id,
            user_id=user_id,
            generated_image_path=final_path,
            provider_info={
                "provider_name": result.provider_name,
                "provider_model": result.provider_model,
                "seed": result.seed,
            },
        )
        
        if not updated_asset:
            # We lost the database race! Another worker already successfully marked this asset.
            logger.info(f"Asset {asset_id} was already completed. Discarding output {final_path}.")
            storage.delete_file(final_path)
        else:
            logger.info(f"Successfully generated and saved asset {asset_id} at {final_path}.")

    except ProviderError as e:
        logger.error(f"Provider error for asset {asset_id}: {e}")
        # Map class name to canonical code (e.g. ProviderTimeoutError -> AI_TIMEOUT)
        error_code = e.__class__.__name__.replace("Provider", "").replace("Error", "").upper()
        if error_code == "TIMEOUT":
            error_code = "AI_TIMEOUT"
        elif error_code == "BROKENRESPONSE":
            error_code = "BROKEN_RESPONSE"
        elif error_code == "CONFIG":
            error_code = "PROVIDER_CONFIG_ERROR"
        elif error_code == "RATELIMIT":
            error_code = "RATE_LIMITED"
        elif error_code == "UNAVAILABLE":
            error_code = "PROVIDER_UNAVAILABLE"

        service.mark_as_failed(asset_id, user_id, error_code, str(e))
    except Exception as e:
        logger.exception(f"Unexpected error generating asset {asset_id}: {e}")
        service.mark_as_failed(
            asset_id, user_id, ErrorCode.INTERNAL_ERROR, "An unexpected error occurred."
        )
