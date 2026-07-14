from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.assets import router as assets_router
from app.api.v1.health import router as health_router
from app.core.logging import setup_logging
from app.db.database import engine
from app.db.schema import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    # Reconcile stale pending assets that were interrupted by a server restart
    from sqlalchemy import update
    import logging
    from app.db.database import SessionLocal
    from app.db.schema import Asset
    from app.models.asset import AssetStatus
    from app.core.constants import ErrorCode
    
    logger = logging.getLogger(__name__)
    try:
        with SessionLocal() as db:
            stmt = (
                update(Asset)
                .where(Asset.status == AssetStatus.pending.value)
                .values(
                    status=AssetStatus.failed.value,
                    error_code=ErrorCode.INTERNAL_ERROR,
                    error_message="Generation interrupted by server restart."
                )
            )
            result = db.execute(stmt)
            db.commit()
            if result.rowcount > 0:
                logger.info(f"Reconciled {result.rowcount} stale pending assets to failed state.")
    except Exception as e:
        logger.error(f"Failed to reconcile stale assets: {e}")
        
    yield


def create_app() -> FastAPI:
    setup_logging()
    application = FastAPI(title="LoreForge API", lifespan=lifespan)
    application.include_router(health_router)
    application.include_router(assets_router)

    from fastapi.staticfiles import StaticFiles

    from app.core.config import settings

    # Ensure media root exists and mount it
    settings.media_root.mkdir(parents=True, exist_ok=True)
    application.mount("/media", StaticFiles(directory=str(settings.media_root)), name="media")

    # We only mount frontend if the directory exists to avoid errors in pure backend dev
    if settings.frontend_dist.exists():
        application.frontend("/", directory=str(settings.frontend_dist))

    return application


app = create_app()
