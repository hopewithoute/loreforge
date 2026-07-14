import shutil

import pytest

from app.storage.local_storage import LocalStorageDriver


@pytest.fixture
def temp_media_root(tmp_path):
    # tmp_path is a built-in pytest fixture that provides a temporary directory unique to the test invocation
    media_root = tmp_path / "media"
    yield media_root
    shutil.rmtree(media_root, ignore_errors=True)


def test_local_storage_save(temp_media_root):
    driver = LocalStorageDriver(media_root=temp_media_root)

    content = b"fake_image_content"
    asset_id = "test-asset-123"

    path = driver.save(asset_id, "original.png", content)

    assert path == f"assets/{asset_id}/original.png"

    physical_path = temp_media_root / "assets" / asset_id / "original.png"
    assert physical_path.exists()
    assert physical_path.read_bytes() == content


def test_local_storage_delete_directory(temp_media_root):
    driver = LocalStorageDriver(media_root=temp_media_root)
    asset_id = "test-asset-456"

    driver.save(asset_id, "file1.png", b"test")
    driver.save(asset_id, "file2.png", b"test")

    asset_dir = temp_media_root / "assets" / asset_id
    assert asset_dir.exists()

    driver.delete_directory(asset_id)

    assert not asset_dir.exists()
