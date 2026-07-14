import uuid
from typing import Annotated

from fastapi import Cookie, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.services.asset_service import AssetService
from app.storage.base import StorageDriver
from app.storage.local_storage import LocalStorageDriver


def validate_image_upload(
    reference_image: Annotated[UploadFile | None, File()] = None,
) -> tuple[bytes | None, str | None]:
    if not reference_image:
        return None, None

    if reference_image.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=422, detail="INVALID_FILE_TYPE")

    reference_bytes = reference_image.file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024

    if len(reference_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail="UPLOAD_TOO_LARGE")

    reference_ext = ".png" if reference_image.content_type == "image/png" else ".jpg"
    return reference_bytes, reference_ext


ValidImageDep = Annotated[tuple[bytes | None, str | None], Depends(validate_image_upload)]


def get_session_id(
    response: Response,
    session_id: Annotated[str | None, Cookie()] = None,
) -> str:
    """
    Retrieves the anonymous session_id from the httpOnly cookie.
    If it doesn't exist, generates a new UUID and sets it.
    """
    if not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 365,  # 1 year
        )
    return session_id


def get_storage_driver() -> StorageDriver:
    return LocalStorageDriver()


def get_asset_service(
    db: Session = Depends(get_db), storage: StorageDriver = Depends(get_storage_driver)
) -> AssetService:
    return AssetService(db, storage)


SessionDep = Annotated[str, Depends(get_session_id)]
AssetServiceDep = Annotated[AssetService, Depends(get_asset_service)]
