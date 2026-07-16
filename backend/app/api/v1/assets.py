from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, status

from app.api.deps import AssetServiceDep, SessionDep
from app.models.asset import AssetCreate, AssetCreateForm, AssetEvolve, AssetRead
from app.services.image_utils import validate_and_read_image
from app.workers.image_worker import generate_image_task

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def create_asset(
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
    form_data: Annotated[AssetCreateForm, Form()],
) -> AssetRead:
    if service.has_pending_assets(session_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You already have a generation in progress. Please wait.",
        )

    data = AssetCreate(
        prompt=form_data.prompt,
        category=form_data.category,
        style=form_data.style,
    )

    # Reference Image Validation Block
    reference_bytes = None
    reference_ext = None
    if (
        form_data.reference_image
        and form_data.reference_image.size is not None
        and form_data.reference_image.size > 0
    ):
        reference_bytes, reference_ext = validate_and_read_image(form_data.reference_image)

    # Create the asset generation record, including the reference image if provided
    # Reference image is resized to max reference size and converted to png
    asset = service.create_asset(
        user_id=session_id,
        data=data,
        reference_bytes=reference_bytes,
        reference_ext=reference_ext,
        existing_reference_id=form_data.existing_reference_id,
        sibling_id=form_data.sibling_id,
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
    if service.has_pending_assets(session_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You already have a generation in progress. Please wait.",
        )

    asset = service.evolve_asset(asset_id, session_id, data)
    if not asset:
        raise HTTPException(status_code=404, detail="Parent asset not found")

    background_tasks.add_task(generate_image_task, asset.id, session_id)
    return asset


@router.post("/{asset_id}/retry", status_code=status.HTTP_202_ACCEPTED)
def retry_asset(
    asset_id: str,
    background_tasks: BackgroundTasks,
    session_id: SessionDep,
    service: AssetServiceDep,
) -> AssetRead:
    if service.has_pending_assets(session_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You already have a generation in progress. Please wait.",
        )

    asset = service.retry_asset(asset_id, session_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Failed asset not found")

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


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: str,
    session_id: SessionDep,
    service: AssetServiceDep,
):
    success = service.delete_asset(asset_id, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")


@router.get("/")
def list_assets(
    session_id: SessionDep,
    service: AssetServiceDep,
) -> list[AssetRead]:
    return service.list_assets(session_id)
