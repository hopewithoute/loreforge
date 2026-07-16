import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.schema import Asset
from app.services.asset_service import AssetService
from tests.test_service import MockStorageDriver


def _create_asset(
    db_session: Session,
    user_id: str,
    status: str = "success",
    parent_id: str | None = None,
    sibling_id: str | None = None,
) -> Asset:
    asset = Asset(
        prompt="Test prompt",
        category="character",
        style="concept_art",
        user_id=user_id,
        status=status,
        parent_id=parent_id,
        sibling_id=sibling_id,
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


def test_delete_asset_cascade(db_session: Session):
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)
    user_id = "user1"

    parent = _create_asset(db_session, user_id)
    child1 = _create_asset(db_session, user_id, parent_id=parent.id)
    child2 = _create_asset(db_session, user_id, parent_id=parent.id)
    grandchild = _create_asset(db_session, user_id, parent_id=child1.id)

    # Verify they exist
    assert db_session.scalar(select(Asset).where(Asset.id == parent.id)) is not None
    assert db_session.scalar(select(Asset).where(Asset.id == grandchild.id)) is not None

    # Delete parent
    result = service.delete_asset(parent.id, user_id)

    assert result is True
    # All should be deleted
    assert db_session.scalar(select(Asset).where(Asset.id == parent.id)) is None
    assert db_session.scalar(select(Asset).where(Asset.id == child1.id)) is None
    assert db_session.scalar(select(Asset).where(Asset.id == child2.id)) is None
    assert db_session.scalar(select(Asset).where(Asset.id == grandchild.id)) is None

    # Storage should be requested to rm these IDs
    assert parent.id in storage.deletions
    assert grandchild.id in storage.deletions


def test_delete_asset_blocked_if_pending(db_session: Session):
    storage = MockStorageDriver()
    service = AssetService(db_session, storage)
    user_id = "user1"

    parent = _create_asset(db_session, user_id)
    child = _create_asset(db_session, user_id, parent_id=parent.id)
    grandchild_pending = _create_asset(db_session, user_id, status="pending", parent_id=child.id)

    # Try deleting parent
    with pytest.raises(ValueError, match="Cannot delete lineage with pending generations"):
        service.delete_asset(parent.id, user_id)

    # Try deleting child
    with pytest.raises(ValueError, match="Cannot delete lineage with pending generations"):
        service.delete_asset(child.id, user_id)

    # Try deleting grandchild itself
    with pytest.raises(ValueError, match="Cannot delete lineage with pending generations"):
        service.delete_asset(grandchild_pending.id, user_id)

    # Verify nothing was deleted
    assert db_session.scalar(select(Asset).where(Asset.id == parent.id)) is not None
    assert db_session.scalar(select(Asset).where(Asset.id == grandchild_pending.id)) is not None
