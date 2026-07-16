import logging
from contextlib import asynccontextmanager
from datetime import timedelta

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles

from app.api.v1.assets import router as assets_router
from app.api.v1.health import router as health_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.database import SessionLocal
from app.services.asset_service import reconcile_stale_assets


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger = logging.getLogger(__name__)
    try:
        with SessionLocal() as db:
            reconcile_stale_assets(db, threshold=timedelta(seconds=0))
    except Exception as e:
        logger.error(f"Failed to reconcile stale assets on startup: {e}")

    yield


def custom_generate_unique_id(route: APIRoute):
    return route.name


def create_app() -> FastAPI:
    setup_logging()
    application = FastAPI(
        title="LoreForge API",
        lifespan=lifespan,
        generate_unique_id_function=custom_generate_unique_id,
    )
    application.include_router(health_router)
    application.include_router(assets_router)

    # Ensure media root exists and mount it
    settings.media_root.mkdir(parents=True, exist_ok=True)
    application.mount(
        settings.media_url,
        StaticFiles(directory=str(settings.media_root)),
        name="media",
    )

    # We only mount frontend if the directory exists to avoid errors in pure backend dev
    if settings.frontend_dist.exists():
        application.frontend("/", directory=str(settings.frontend_dist))

    def custom_openapi():
        if application.openapi_schema:
            return application.openapi_schema

        openapi_schema = get_openapi(
            title=application.title,
            version=application.version,
            openapi_version=application.openapi_version,
            description=application.description,
            routes=application.routes,
        )

        # FastAPI's Annotated[BaseModel, Form()] forces application/x-www-form-urlencoded.
        # We manually patch it to multipart/form-data for /api/assets/ to support file uploads.
        for path, path_item in openapi_schema.get("paths", {}).items():
            if path.startswith("/api/assets/"):
                for operation in path_item.items():
                    if "requestBody" in operation and "content" in operation["requestBody"]:
                        content = operation["requestBody"]["content"]
                        if "application/x-www-form-urlencoded" in content:
                            content["multipart/form-data"] = content.pop(
                                "application/x-www-form-urlencoded"
                            )

        application.openapi_schema = openapi_schema
        return application.openapi_schema

    application.openapi = custom_openapi

    return application


app = create_app()
