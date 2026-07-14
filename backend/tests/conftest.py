import io

import pytest
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.api.v1.assets
from app.db.schema import Base
from app.providers.base import GeneratedImageResult
from app.providers.cloudflare_flux import CloudflareFluxAdapter

# Use an in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def mock_background_tasks(monkeypatch):
    # Prevent BackgroundTasks from executing generate_image_task in integration tests
    async def mock_task(*args, **kwargs):
        pass

    monkeypatch.setattr(app.api.v1.assets, "generate_image_task", mock_task)


@pytest.fixture(autouse=True)
def mock_cloudflare_adapter(monkeypatch):
    async def mock_generate(*args, **kwargs):
        # Create a dummy image
        img = Image.new("RGB", (100, 100), color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")

        return GeneratedImageResult(
            image_bytes=buf.getvalue(),
            provider_name="cloudflare",
            provider_model="mock_model",
            seed=42,
        )

    monkeypatch.setattr(CloudflareFluxAdapter, "generate", mock_generate)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
