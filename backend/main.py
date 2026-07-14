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
        application.mount("/", StaticFiles(directory=str(settings.frontend_dist), html=True), name="frontend")

    return application


app = create_app()
