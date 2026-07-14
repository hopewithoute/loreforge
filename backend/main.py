from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.assets import router as assets_router
from app.api.v1.health import router as health_router
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging

    from app.db.database import SessionLocal
    from app.services.asset_service import reconcile_stale_assets

    logger = logging.getLogger(__name__)
    try:
        with SessionLocal() as db:
            reconcile_stale_assets(db)
    except Exception as e:
        logger.error(f"Failed to reconcile stale assets on startup: {e}")

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
