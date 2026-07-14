import uuid

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db.schema import Asset
from app.models.asset import AssetCreate, AssetEvolve, AssetRead, AssetStatus
from app.services.image_utils import prepare_provider_image
from app.storage.base import StorageDriver


class AssetService:
    def __init__(self, session: Session, storage: StorageDriver):
        self._db = session
        self._storage = storage

    def _get_asset_orm(self, asset_id: str, user_id: str) -> Asset | None:
        stmt = select(Asset).where(Asset.id == asset_id, Asset.user_id == user_id)
        return self._db.scalars(stmt).first()

    def create_asset(
        self,
        user_id: str,
        data: AssetCreate,
        reference_bytes: bytes | None = None,
        reference_ext: str | None = None,
    ) -> AssetRead:
        # We allocate the asset ID early so we can use it to create
        # a strictly isolated directory for this asset's files.
        asset_id = str(uuid.uuid4())
        asset = Asset(
            id=asset_id,
            user_id=user_id,
            prompt=data.prompt,
            category=data.category.value,
            style=data.style.value,
        )

        try:
            # Step 1: Handle physical file persistence first
            if reference_bytes and reference_ext:
                # Store the exact uploaded file for user reference/gallery viewing
                original_path = self._storage.save(
                    asset_id, f"original{reference_ext}", reference_bytes
                )
                asset.reference_image_path = original_path

                # Create a downscaled copy specifically formatted for the AI provider
                # (e.g., max 511px for Cloudflare FLUX)
                prepared_bytes = prepare_provider_image(reference_bytes)
                prepared_path = self._storage.save(asset_id, "prepared.png", prepared_bytes)
                asset.prepared_input_path = prepared_path

            # Step 2: Attempt to persist the database record
            self._db.add(asset)
            self._db.commit()
            self._db.refresh(asset)
            return AssetRead.model_validate(asset)

        except Exception as e:
            # Step 3: Rollback & Cleanup on failure
            # If the database fails (e.g. SQLite locked), we must sweep any newly
            # created images to prevent digital garbage/orphan files on disk.
            self._db.rollback()
            self._storage.delete_directory(asset_id)
            raise e

    def get_asset(self, asset_id: str, user_id: str) -> AssetRead | None:
        asset = self._get_asset_orm(asset_id, user_id)
        return AssetRead.model_validate(asset) if asset else None

    def evolve_asset(self, parent_id: str, user_id: str, data: AssetEvolve) -> AssetRead | None:
        parent = self._get_asset_orm(parent_id, user_id)
        if not parent:
            return None

        asset_id = str(uuid.uuid4())
        asset = Asset(
            id=asset_id,
            user_id=user_id,
            prompt=data.prompt,
            category=data.category.value,
            style=data.style.value,
            parent_id=parent_id,
        )

        try:
            self._db.add(asset)
            self._db.commit()
            self._db.refresh(asset)
            return AssetRead.model_validate(asset)
        except Exception as e:
            self._db.rollback()
            raise e

    def list_assets(self, user_id: str) -> list[AssetRead]:
        stmt = select(Asset).where(Asset.user_id == user_id).order_by(Asset.created_at.desc())
        return [AssetRead.model_validate(a) for a in self._db.scalars(stmt)]

    def update_status(self, asset_id: str, user_id: str, status: str, **kwargs) -> AssetRead | None:
        # Atomic update based on status == pending
        stmt = (
            update(Asset)
            .where(
                Asset.id == asset_id,
                Asset.user_id == user_id,
                Asset.status == AssetStatus.pending.value,
            )
            .values(status=status, **kwargs)
        )
        self._db.execute(stmt)
        self._db.commit()

        # Whether the update succeeded (rowcount=1) or failed due to race condition (rowcount=0),
        # we fetch and return the current true state of the database.
        asset = self._get_asset_orm(asset_id, user_id)
        if asset:
            return AssetRead.model_validate(asset)
        return None

    def mark_as_success(
        self,
        asset_id: str,
        user_id: str,
        generated_image_path: str,
        provider_info: dict,
    ) -> AssetRead | None:
        return self.update_status(
            asset_id,
            user_id,
            status=AssetStatus.success.value,
            generated_image_path=generated_image_path,
            **provider_info,
        )

    def mark_as_failed(
        self, asset_id: str, user_id: str, error_code: str, error_message: str
    ) -> AssetRead | None:
        return self.update_status(
            asset_id,
            user_id,
            status=AssetStatus.failed.value,
            error_code=error_code,
            error_message=error_message,
        )


def reconcile_stale_assets(db: Session) -> int:
    """
    Reconcile stale pending assets that were interrupted by a server restart.
    Marks them as failed so they don't stay pending forever
    Needed For worker that doesn't have durability across restarts.
    """
    import logging

    from app.core.constants import ErrorCode

    logger = logging.getLogger(__name__)

    stmt = (
        update(Asset)
        .where(Asset.status == AssetStatus.pending.value)
        .values(
            status=AssetStatus.failed.value,
            error_code=ErrorCode.INTERNAL_ERROR,
            error_message="Generation interrupted by server restart.",
        )
    )
    from typing import cast

    from sqlalchemy import CursorResult

    result = cast(CursorResult, db.execute(stmt))
    db.commit()

    if result.rowcount > 0:
        logger.info(f"Reconciled {result.rowcount} stale pending assets to failed state.")

    return result.rowcount
