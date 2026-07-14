from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.api.deps import AssetServiceDep, SessionDep
from app.core.config import settings
from app.models.asset import AssetCategory, AssetCreate, AssetRead, AssetStyle

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def create_asset(
    session_id: SessionDep,
    service: AssetServiceDep,
    prompt: Annotated[str, Form(min_length=3)],
    category: Annotated[AssetCategory, Form()],
    style: Annotated[AssetStyle, Form()],
    parent_id: Annotated[str | None, Form()] = None,
    reference_image: UploadFile | None = File(default=None),
) -> AssetRead:
    data = AssetCreate(prompt=prompt, category=category, style=style, parent_id=parent_id)

    # Boundary 1: HTTP Transport & Validation
    # We validate FastAPI's UploadFile here at the router layer so that our
    # inner Service layer only ever receives pure Python `bytes`.
    # This prevents HTTP-specific objects from leaking into domain logic.
    reference_bytes = None
    reference_ext = None

    if reference_image:
        # Prevent malformed or unsupported formats
        if reference_image.content_type not in ("image/jpeg", "image/png"):
            raise HTTPException(status_code=422, detail="INVALID_FILE_TYPE")

        # Load into memory safely (size is restricted by settings)
        reference_bytes = reference_image.file.read()
        max_bytes = settings.max_upload_mb * 1024 * 1024

        # Block oversized files immediately before they burden the system
        if len(reference_bytes) > max_bytes:
            raise HTTPException(status_code=413, detail="UPLOAD_TOO_LARGE")

        reference_ext = ".png" if reference_image.content_type == "image/png" else ".jpg"

    return service.create_asset(
        user_id=session_id,
        data=data,
        reference_bytes=reference_bytes,
        reference_ext=reference_ext,
    )


@router.get("/{asset_id}")
def get_asset(
    asset_id: str,
    session_id: SessionDep,
    service: AssetServiceDep,
) -> AssetRead:
    asset = service.get_asset(asset_id, session_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("/")
def list_assets(
    session_id: SessionDep,
    service: AssetServiceDep,
) -> list[AssetRead]:
    return service.list_assets(session_id)
