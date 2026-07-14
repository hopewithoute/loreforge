from fastapi import APIRouter, HTTPException, status

from app.api.deps import AssetServiceDep, SessionDep
from app.models.asset import AssetCreate, AssetRead

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
def create_asset(
    data: AssetCreate,
    session_id: SessionDep,
    service: AssetServiceDep,
) -> AssetRead:
    return service.create_asset(user_id=session_id, data=data)


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
