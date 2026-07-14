import shutil
from pathlib import Path

from app.core.config import settings


class LocalStorageDriver:
    def __init__(self, media_root: str | Path | None = None):
        self.media_root = Path(media_root) if media_root else settings.media_root
        self.media_root.mkdir(parents=True, exist_ok=True)

    def _get_asset_dir(self, asset_id: str) -> Path:
        asset_dir = self.media_root / "assets" / asset_id
        asset_dir.mkdir(parents=True, exist_ok=True)
        return asset_dir

    def save(self, asset_id: str, filename: str, content: bytes) -> str:
        """
        Saves content via atomic write to prevent corruption if interrupted.
        Returns the relative path (e.g. assets/{asset_id}/original.png).
        """
        asset_dir = self._get_asset_dir(asset_id)
        final_path = asset_dir / filename
        temp_path = final_path.with_suffix(".tmp")

        # Atomic write
        temp_path.write_bytes(content)
        temp_path.replace(final_path)

        return f"assets/{asset_id}/{filename}"

    def delete_directory(self, asset_id: str) -> None:
        asset_dir = self.media_root / "assets" / asset_id
        if asset_dir.exists() and asset_dir.is_dir():
            shutil.rmtree(asset_dir, ignore_errors=True)

    def read(self, relative_path: str) -> bytes:
        file_path = self.media_root / relative_path
        if not file_path.exists():
            raise FileNotFoundError(f"Storage cannot find file: {relative_path}")
        return file_path.read_bytes()
