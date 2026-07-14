from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.assets import router as assets_router
from app.api.v1.health import router as health_router
from app.db.database import engine
from app.db.schema import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    application = FastAPI(title="LoreForge API", lifespan=lifespan)
    application.include_router(health_router)
    application.include_router(assets_router)

    from app.core.config import settings

    # We only mount frontend if the directory exists to avoid errors in pure backend dev
    if settings.frontend_dist.exists():
        application.frontend("/", directory=str(settings.frontend_dist))

    return application


app = create_app()
