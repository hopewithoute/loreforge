import uuid
from typing import Annotated

import fsspec
from fastapi import Cookie, Depends, Response
from sqlalchemy.orm import Session

from app.bootstrap import get_storage_driver
from app.db.database import get_db
from app.services.asset_service import AssetService

DbDep = Annotated[Session, Depends(get_db)]
StorageDep = Annotated[fsspec.AbstractFileSystem, Depends(get_storage_driver)]


def get_asset_service(db: DbDep, storage: StorageDep) -> AssetService:
    return AssetService(db, storage)


AssetServiceDep = Annotated[AssetService, Depends(get_asset_service)]


def get_session_id(
    response: Response,
    session_id: Annotated[str | None, Cookie()] = None,
) -> str:
    """
    Retrieves the anonymous session_id from the httpOnly cookie.
    If it doesn't exist, generates a new UUID and sets it.
    """
    if not session_id:
        session_id = str(uuid.uuid7())
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 365,  # 1 year
        )
    return session_id


SessionDep = Annotated[str, Depends(get_session_id)]
