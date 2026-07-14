import uuid
from typing import Annotated

from fastapi import Cookie, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import ErrorCode, Extension, MimeType
from app.db.database import get_db
from app.providers.base import AIProvider
from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.services.asset_service import AssetService
from app.storage.base import StorageDriver
from app.storage.local_storage import LocalStorageDriver


def get_storage_driver() -> StorageDriver:
    return LocalStorageDriver()


def get_ai_provider() -> AIProvider:
    return CloudflareFluxAdapter()


def get_asset_service(
    db: Session = Depends(get_db), storage: StorageDriver = Depends(get_storage_driver)
) -> AssetService:
    return AssetService(db, storage)


AssetServiceDep = Annotated[AssetService, Depends(get_asset_service)]


def validate_image_upload(
    reference_image: Annotated[UploadFile | None, File()] = None,
) -> tuple[bytes | None, str | None]:
    if not reference_image:
        return None, None

    if reference_image.content_type not in (MimeType.JPEG, MimeType.PNG):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorCode.INVALID_FILE_TYPE,
        )

    reference_bytes = reference_image.file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024

    if len(reference_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=ErrorCode.UPLOAD_TOO_LARGE,
        )

    reference_ext = Extension.PNG if reference_image.content_type == MimeType.PNG else Extension.JPEG
    return reference_bytes, reference_ext


ValidImageDep = Annotated[tuple[bytes | None, str | None], Depends(validate_image_upload)]


from fastapi import Header

def get_session_id(
    x_user_id: Annotated[str | None, Header()] = None,
) -> str:
    """
    Retrieves the anonymous user ID from the x-user-id header.
    Requires the client to manage their UUID (e.g., in LocalStorage).
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="x-user-id header missing"
        )
    return x_user_id

SessionDep = Annotated[str, Depends(get_session_id)]
