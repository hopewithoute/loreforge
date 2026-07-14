from typing import Protocol


class StorageDriver(Protocol):
    def save(self, asset_id: str, filename: str, content: bytes) -> str:
        """
        Saves content to the storage backend.
        Returns the relative path for database storage (e.g. assets/{asset_id}/original.png).
        """
        ...

    def delete_directory(self, asset_id: str) -> None:
        """
        Deletes the entire directory associated with the asset_id.
        Useful for cleanup if request fails.
        """
        ...

    def read(self, relative_path: str) -> bytes:
        """
        Reads content from the storage backend based on a relative path.
        """
        ...
