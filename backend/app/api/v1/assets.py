import asyncio
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, status

from app.api.deps import AssetServiceDep, SessionDep
from app.models.asset import AssetCreate, AssetCreateForm, AssetEvolve, AssetRead
from app.services.image_utils import validate_and_read_image
from app.workers.image_worker import generate_image_task

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
async def create_asset(
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
    form_data: Annotated[AssetCreateForm, Form()],
) -> AssetRead:
    data = AssetCreate(
        prompt=form_data.prompt,
        category=form_data.category,
        style=form_data.style,
    )

    reference_bytes = None
    reference_ext = None
    if form_data.reference_image:
        reference_bytes, reference_ext = await validate_and_read_image(form_data.reference_image)

    # Run the synchronous database and storage I/O in a threadpool to prevent blocking the async event loop
    asset = await asyncio.to_thread(
        service.create_asset,
        session_id,  # user_id
        data,
        reference_bytes,
        reference_ext,
    )

    # Offload the AI generation and disk IO to the background worker
    background_tasks.add_task(generate_image_task, asset.id, session_id)

    return asset


@router.post("/{asset_id}/evolve", status_code=status.HTTP_202_ACCEPTED)
def evolve_asset(
    asset_id: str,
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
    data: AssetEvolve,
) -> AssetRead:
    asset = service.evolve_asset(asset_id, session_id, data)
    if not asset:
        raise HTTPException(status_code=404, detail="Parent asset not found")

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
