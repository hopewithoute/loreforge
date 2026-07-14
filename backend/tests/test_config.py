from pathlib import Path

from app.config import Settings


def test_settings_loads_values_from_dotenv_file(tmp_path: Path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "DATABASE_URL=sqlite:///./data/from-env.sqlite3\n"
        "AI_TIMEOUT_SECONDS=42\n"
        "FORCE_AI_TIMEOUT=true\n",
        encoding="utf-8",
    )

    loaded = Settings(_env_file=env_file)  # pyright: ignore[reportCallIssue]

    assert loaded.database_url == "sqlite:///./data/from-env.sqlite3"
    assert loaded.ai_timeout_seconds == 42
    assert loaded.force_ai_timeout is True
