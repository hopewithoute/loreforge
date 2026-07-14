import io

from datetime import UTC, datetime, timedelta

import pytest
from PIL import Image
from sqlalchemy.orm import Session

from app.db.schema import Asset
from app.models.asset import AssetCategory, AssetCreate, AssetStatus, AssetStyle
from app.services.asset_service import AssetService, reconcile_stale_assets
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

    def delete_file(self, relative_path: str) -> None:
        pass

    def read(self, relative_path: str) -> bytes:
        return b"mock content"


def test_asset_service_create_asset_success(db_session: Session, dummy_image_bytes: bytes):
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)

    data = AssetCreate(
        prompt="test prompt", category=AssetCategory.character, style=AssetStyle.pixel_art
    )

    asset = service.create_asset("user-123", data, dummy_image_bytes, ".png")

    assert asset.prompt == "test prompt"
    assert asset.status == AssetStatus.pending
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

    assert asset.status == AssetStatus.pending

    # Mark as success
    success_asset = service.mark_as_success(
        asset.id,
        "user-456",
        "mock/gen.png",
        {"provider_name": "cloudflare", "provider_model": "flux", "seed": 42},
    )

    assert success_asset is not None
    assert success_asset.status == AssetStatus.success
    assert success_asset.generated_image_path == "mock/gen.png"
    assert success_asset.provider_model == "flux"
    assert success_asset.seed == 42

    # Try marking as failed after success (should be ignored because status != pending)
    failed_asset = service.mark_as_failed(asset.id, "user-456", "ERR_01", "Failed")

    # It should return None because it lost the atomic race (it wasn't pending)
    assert failed_asset is None

    # Fetch to ensure it is still success
    current_asset = service.get_asset(asset.id, "user-456")
    assert current_asset is not None
    assert current_asset.status == AssetStatus.success
    assert current_asset.error_code is None


def test_reconcile_stale_assets(db_session: Session):
    
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)

    # Create one recent pending asset
    recent_data = AssetCreate(prompt="recent", category=AssetCategory.prop, style=AssetStyle.pixel_art)
    recent_asset = service.create_asset("u1", recent_data)

    # Create one stale pending asset (older than 5 minutes)
    stale_data = AssetCreate(prompt="stale", category=AssetCategory.prop, style=AssetStyle.pixel_art)
    stale_asset = service.create_asset("u1", stale_data)
    
    # Manually backdate the stale asset in the DB
    stale_orm = db_session.query(Asset).filter_by(id=stale_asset.id).first()
    stale_orm.created_at = datetime.now(UTC) - timedelta(minutes=10)
    db_session.commit()

    # Reconcile
    reconciled_count = reconcile_stale_assets(db_session)
    assert reconciled_count == 1
    
    # Check states
    recent_check = service.get_asset(recent_asset.id, "u1")
    assert recent_check.status == AssetStatus.pending
    
    stale_check = service.get_asset(stale_asset.id, "u1")
    assert stale_check.status == AssetStatus.failed
    assert stale_check.error_code == "INTERNAL_ERROR"
