import io

import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.models.asset import AssetCategory, AssetCreate, AssetStyle
from app.services.asset_service import AssetService
from app.storage.base import StorageDriver


@pytest.fixture
def dummy_image_bytes():
    img = Image.new("RGB", (100, 100), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# A mock storage driver that tracks method calls and simulates failures
class MockStorageDriver(StorageDriver):
    def __init__(self, should_fail=False):
        self.saves = []
        self.deletions = []
        self.should_fail = should_fail

    def save(self, asset_id: str, filename: str, content: bytes) -> str:
        if self.should_fail:
            raise Exception("Mock storage failure")
        self.saves.append((asset_id, filename))
        return f"mock/{asset_id}/{filename}"

    def delete_directory(self, asset_id: str) -> None:
        self.deletions.append(asset_id)


def test_asset_service_create_asset_success(db_session: Session, dummy_image_bytes: bytes):
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)

    data = AssetCreate(
        prompt="test prompt", category=AssetCategory.character, style=AssetStyle.pixel_art
    )

    asset = service.create_asset("user-123", data, dummy_image_bytes, ".png")

    assert asset.prompt == "test prompt"
    assert asset.status == "pending"
    assert len(storage.saves) == 2
    assert storage.saves[0][1] == "original.png"
    assert storage.saves[1][1] == "prepared.png"


def test_asset_service_create_asset_rollback_on_db_error(
    db_session: Session, dummy_image_bytes: bytes, monkeypatch
):
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)

    data = AssetCreate(prompt="test", category=AssetCategory.prop, style=AssetStyle.dark_fantasy)

    # Force the database commit to fail
    def mock_commit():
        raise Exception("DB Lock")

    monkeypatch.setattr(db_session, "commit", mock_commit)

    with pytest.raises(Exception, match="DB Lock"):
        service.create_asset("user-123", data, dummy_image_bytes, ".jpg")

    # Verify storage deletion was triggered due to DB rollback
    assert len(storage.deletions) == 1


def test_asset_service_status_updates(db_session: Session):
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)

    data = AssetCreate(
        prompt="test", category=AssetCategory.environment, style=AssetStyle.concept_art
    )
    asset = service.create_asset("user-456", data)

    assert asset.status == "pending"

    # Mark as success
    success_asset = service.mark_as_success(
        asset.id,
        "user-456",
        "mock/gen.png",
        {"provider_name": "cloudflare", "provider_model": "flux", "seed": 42},
    )

    assert success_asset is not None
    assert success_asset.status == "success"
    assert success_asset.generated_image_path == "mock/gen.png"
    assert success_asset.provider_model == "flux"
    assert success_asset.seed == 42

    # Try marking as failed after success (should be ignored because status != pending)
    failed_asset = service.mark_as_failed(asset.id, "user-456", "ERR_01", "Failed")

    # It should still be success
    assert failed_asset is not None
    assert failed_asset.status == "success"
    assert failed_asset.error_code is None
