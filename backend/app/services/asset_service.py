from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.schema import Asset
from app.models.asset import AssetCreate, AssetRead


class AssetService:
    def __init__(self, session: Session):
        self._db = session

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
        import uuid

        from app.services.image_utils import prepare_provider_image
        from app.storage.local_storage import LocalStorageDriver

        asset_id = str(uuid.uuid4())
        asset = Asset(
            id=asset_id,
            user_id=user_id,
            prompt=data.prompt,
            category=data.category.value,
            style=data.style.value,
            parent_id=data.parent_id,
        )

        storage = LocalStorageDriver()

        try:
            if reference_bytes and reference_ext:
                # Save original
                original_path = storage.save(asset_id, f"original{reference_ext}", reference_bytes)
                asset.reference_image_path = original_path

                # Prepare and save provider copy
                prepared_bytes = prepare_provider_image(reference_bytes)
                prepared_path = storage.save(asset_id, "prepared.png", prepared_bytes)
                asset.prepared_input_path = prepared_path

            self._db.add(asset)
            self._db.commit()
            self._db.refresh(asset)
            return AssetRead.model_validate(asset)
        except Exception as e:
            self._db.rollback()
            storage.delete_directory(asset_id)
            raise e

    def get_asset(self, asset_id: str, user_id: str) -> AssetRead | None:
        asset = self._get_asset_orm(asset_id, user_id)
        return AssetRead.model_validate(asset) if asset else None

    def list_assets(self, user_id: str) -> list[AssetRead]:
        stmt = select(Asset).where(Asset.user_id == user_id).order_by(Asset.created_at.desc())
        return [AssetRead.model_validate(a) for a in self._db.scalars(stmt)]

    def update_status(self, asset_id: str, user_id: str, status: str, **kwargs) -> AssetRead | None:
        asset = self._get_asset_orm(asset_id, user_id)

        if not asset or asset.status != "pending":
            return AssetRead.model_validate(asset) if asset else None

        asset.status = status
        for key, value in kwargs.items():
            setattr(asset, key, value)

        self._db.commit()
        self._db.refresh(asset)
        return AssetRead.model_validate(asset)

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
            status="success",
            generated_image_path=generated_image_path,
            **provider_info,
        )

    def mark_as_failed(
        self, asset_id: str, user_id: str, error_code: str, error_message: str
    ) -> AssetRead | None:
        return self.update_status(
            asset_id,
            user_id,
            status="failed",
            error_code=error_code,
            error_message=error_message,
        )
