from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, status

from app.api.deps import AssetServiceDep, SessionDep
from app.models.asset import AssetCreate, AssetRead, AssetCreateForm
from app.core.constants import MimeType, Extension
from app.core.config import settings
from app.workers.image_worker import generate_image_task

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def create_asset(
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
    form_data: Annotated[AssetCreateForm, Form()],
) -> AssetRead:
    reference_bytes = None
    reference_ext = None
    
    if form_data.reference_image:
        reference_bytes = form_data.reference_image.file.read()
        max_bytes = settings.max_upload_mb * 1024 * 1024
        
        if len(reference_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="File size exceeds the maximum limit.",
            )
            
        reference_ext = Extension.PNG if form_data.reference_image.content_type == MimeType.PNG else Extension.JPEG

    data = AssetCreate(
        prompt=form_data.prompt, 
        category=form_data.category, 
        style=form_data.style, 
        parent_id=form_data.parent_id
    )

    asset = service.create_asset(
        user_id=session_id,
        data=data,
        reference_bytes=reference_bytes,
        reference_ext=reference_ext,
    )

    # Offload the AI generation and disk IO to the background worker
    background_tasks.add_task(generate_image_task, asset.id, session_id)

    return asset


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
