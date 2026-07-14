from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, status

from app.api.deps import AssetServiceDep, SessionDep, ValidImageDep
from app.models.asset import AssetCategory, AssetCreate, AssetRead, AssetStyle
from app.workers.image_worker import generate_image_task

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def create_asset(
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
    prompt: Annotated[str, Form(min_length=3)],
    category: Annotated[AssetCategory, Form()],
    style: Annotated[AssetStyle, Form()],
    image_data: ValidImageDep,
    parent_id: Annotated[str | None, Form()] = None,
) -> AssetRead:
    reference_bytes, reference_ext = image_data
    data = AssetCreate(prompt=prompt, category=category, style=style, parent_id=parent_id)

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
