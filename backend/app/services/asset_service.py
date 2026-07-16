import contextlib
import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import cast

import fsspec
from sqlalchemy import CursorResult, select, update
from sqlalchemy.orm import Session

from app.core.constants import ErrorCode
from app.db.schema import Asset
from app.models.asset import AssetCreate, AssetEvolve, AssetRead, AssetStatus
from app.services.image_utils import prepare_provider_image

logger = logging.getLogger(__name__)
STALE_ASSET_THRESHOLD = timedelta(minutes=5)


class AssetService:
    def __init__(self, session: Session, storage: fsspec.AbstractFileSystem):
        self._db = session
        self._storage = storage

    def _get_asset_orm(self, asset_id: str, user_id: str) -> Asset | None:
        stmt = select(Asset).where(Asset.id == asset_id, Asset.user_id == user_id)
        return self._db.scalars(stmt).first()

    def has_pending_assets(self, user_id: str) -> bool:
        stmt = (
            select(Asset)
            .where(Asset.user_id == user_id, Asset.status == AssetStatus.pending.value)
            .limit(1)
        )
        return self._db.scalars(stmt).first() is not None

    def create_asset(
        self,
        user_id: str,
        data: AssetCreate,
        reference_bytes: bytes | None = None,
        reference_ext: str | None = None,
        existing_reference_id: str | None = None,
        sibling_id: str | None = None,
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

        if sibling_id:
            original_asset = self._get_asset_orm(sibling_id, user_id)
            if original_asset:
                asset.parent_id = original_asset.parent_id
                asset.sibling_id = original_asset.sibling_id or original_asset.id

        try:
            # Step 1: Handle physical file persistence first
            if reference_bytes and reference_ext:
                # Store the exact uploaded file for user reference/gallery viewing
                original_path = f"assets/{asset_id}/original{reference_ext}"
                self._storage.pipe_file(original_path, reference_bytes)
                asset.reference_image_path = original_path

                # Create a downscaled copy specifically formatted for the AI provider
                # (e.g., max 511px for Cloudflare FLUX)
                prepared_bytes = prepare_provider_image(reference_bytes)
                prepared_path = f"assets/{asset_id}/prepared.png"
                self._storage.pipe_file(prepared_path, prepared_bytes)
                asset.prepared_input_path = prepared_path
            elif existing_reference_id:
                # User wants to regenerate using an existing image. We physically copy it.
                old_asset = self._get_asset_orm(existing_reference_id, user_id)
                if old_asset and old_asset.reference_image_path and old_asset.prepared_input_path:
                    new_ref_path = (
                        f"assets/{asset_id}/{old_asset.reference_image_path.split('/')[-1]}"
                    )
                    new_prep_path = f"assets/{asset_id}/prepared.png"

                    self._storage.copy(old_asset.reference_image_path, new_ref_path)
                    self._storage.copy(old_asset.prepared_input_path, new_prep_path)

                    asset.reference_image_path = new_ref_path
                    asset.prepared_input_path = new_prep_path

            # Step 2: Attempt to persist the database record
            self._db.add(asset)
            self._db.commit()
            self._db.refresh(asset)
            return AssetRead.model_validate(asset)

        except Exception:
            # Step 3: Rollback & Cleanup on failure
            # If the database fails (e.g. SQLite locked), we must sweep any newly
            # created images to prevent orphan files on disk.
            self._db.rollback()
            with contextlib.suppress(FileNotFoundError):
                self._storage.rm(f"assets/{asset_id}", recursive=True)
            raise

    def get_asset(self, asset_id: str, user_id: str) -> AssetRead | None:
        asset = self._get_asset_orm(asset_id, user_id)
        return AssetRead.model_validate(asset) if asset else None

    def delete_asset(self, asset_id: str, user_id: str) -> bool:
        asset = self._get_asset_orm(asset_id, user_id)
        if not asset:
            return False

        try:
            self._db.delete(asset)
            self._db.commit()
            with contextlib.suppress(FileNotFoundError):
                self._storage.rm(f"assets/{asset_id}", recursive=True)
            return True
        except Exception:
            self._db.rollback()
            raise

    def retry_asset(self, asset_id: str, user_id: str) -> AssetRead | None:
        asset = self._get_asset_orm(asset_id, user_id)
        if not asset or asset.status != AssetStatus.failed.value:
            return None

        # Reset status and clear error messages
        asset.status = AssetStatus.pending.value
        asset.error_code = None
        asset.error_message = None

        self._db.commit()
        self._db.refresh(asset)
        return AssetRead.model_validate(asset)

    def evolve_asset(self, parent_id: str, user_id: str, data: AssetEvolve) -> AssetRead | None:
        parent = self._get_asset_orm(parent_id, user_id)
        if not parent or not parent.generated_image_path:
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
            # Prepare the parent's generated image to be used as the new asset's input
            parent_image_bytes = cast(bytes, self._storage.cat_file(parent.generated_image_path))
            prepared_bytes = prepare_provider_image(parent_image_bytes)

            prepared_path = f"assets/{asset_id}/prepared.png"
            self._storage.pipe_file(prepared_path, prepared_bytes)
            asset.prepared_input_path = prepared_path

            self._db.add(asset)
            self._db.commit()
            self._db.refresh(asset)
            return AssetRead.model_validate(asset)
        except Exception:
            self._db.rollback()
            with contextlib.suppress(FileNotFoundError):
                self._storage.rm(f"assets/{asset_id}", recursive=True)
            raise

    def list_assets(self, user_id: str) -> list[AssetRead]:
        stmt = select(Asset).where(Asset.user_id == user_id).order_by(Asset.created_at.desc())
        return [AssetRead.model_validate(a) for a in self._db.scalars(stmt)]

    def _transition_pending(
        self,
        asset_id: str,
        user_id: str,
        status: AssetStatus,
        values: dict[str, object],
    ) -> AssetRead | None:
        # Atomic update based on status == pending
        stmt = (
            update(Asset)
            .where(
                Asset.id == asset_id,
                Asset.user_id == user_id,
                Asset.status == AssetStatus.pending.value,
            )
            .values(status=status.value, **values)
        )

        result = cast(CursorResult, self._db.execute(stmt))
        self._db.commit()

        if result.rowcount == 0:
            return None

        # Fetch and return the updated state
        asset = self._get_asset_orm(asset_id, user_id)
        assert asset is not None, f"Row {asset_id} vanished after successful UPDATE"
        return AssetRead.model_validate(asset)

    def mark_as_success(
        self,
        asset_id: str,
        user_id: str,
        generated_image_path: str,
        provider_name: str,
        provider_model: str,
        seed: int | None,
    ) -> AssetRead | None:
        return self._transition_pending(
            asset_id,
            user_id,
            status=AssetStatus.success,
            values={
                "generated_image_path": generated_image_path,
                "provider_name": provider_name,
                "provider_model": provider_model,
                "seed": seed,
            },
        )

    def mark_as_failed(
        self,
        asset_id: str,
        user_id: str,
        error_code: ErrorCode,
        error_message: str,
    ) -> AssetRead | None:
        return self._transition_pending(
            asset_id,
            user_id,
            status=AssetStatus.failed,
            values={
                "error_code": error_code,
                "error_message": error_message,
            },
        )


def reconcile_stale_assets(db: Session, threshold: timedelta | None = None) -> int:
    """
    Reconcile stale pending assets that were interrupted by a server restart.
    Marks them as failed so they don't stay pending forever.
    Only targets assets older than the given threshold (default 5 minutes).
    """
    active_threshold = threshold if threshold is not None else STALE_ASSET_THRESHOLD
    stale_threshold = datetime.now(UTC) - active_threshold

    stmt = (
        update(Asset)
        .where(Asset.status == AssetStatus.pending.value, Asset.created_at < stale_threshold)
        .values(
            status=AssetStatus.failed.value,
            error_code=ErrorCode.INTERNAL_ERROR,
            error_message="Generation interrupted by server restart.",
        )
    )

    result = cast(CursorResult, db.execute(stmt))
    db.commit()

    if result.rowcount > 0:
        logger.info(f"Reconciled {result.rowcount} stale pending assets to failed state.")

    return result.rowcount
