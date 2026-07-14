from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, status

from app.api.deps import AssetServiceDep, SessionDep
from app.models.asset import AssetCreate, AssetRead, AssetCreateForm
from app.workers.image_worker import generate_image_task

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def create_asset(
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
    form_data: Annotated[AssetCreateForm, Form()],
) -> AssetRead:
    data = AssetCreate(
        prompt=form_data.prompt, 
        category=form_data.category, 
        style=form_data.style, 
        parent_id=form_data.parent_id
    )

    asset = service.create_asset(
        user_id=session_id,
        data=data,
        reference_bytes=form_data.reference_bytes,
        reference_ext=form_data.reference_ext,
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
