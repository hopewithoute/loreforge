from pathlib import Path

from starlette.routing import Mount

from app.core.config import BACKEND_ROOT, ENV_FILES, REPO_ROOT, Settings, settings
from main import create_app


def test_default_env_files_cover_repo_and_backend_roots() -> None:
    assert ENV_FILES == (REPO_ROOT / ".env", BACKEND_ROOT / ".env")
    assert BACKEND_ROOT == REPO_ROOT / "backend"


def test_settings_loads_values_from_dotenv_file(tmp_path: Path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "DATABASE_URL=sqlite:///./data/from-env.sqlite3\n"
        "AI_TIMEOUT_SECONDS=42\n",
        encoding="utf-8",
    )

    loaded = Settings(_env_file=env_file)  # pyright: ignore[reportCallIssue]

    assert loaded.database_url == "sqlite:///./data/from-env.sqlite3"
    assert loaded.ai_timeout_seconds == 42


def test_create_app_mounts_media_at_configured_url(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "media_root", tmp_path / "media")
    monkeypatch.setattr(settings, "media_url", "/generated-media")
    monkeypatch.setattr(settings, "frontend_dist", tmp_path / "missing-frontend")

    application = create_app()

    media_mounts = [
        route for route in application.routes if isinstance(route, Mount) and route.name == "media"
    ]
    assert len(media_mounts) == 1
    assert media_mounts[0].path == "/generated-media"
