from pathlib import Path

from sqlalchemy import text

from app.db.database import (
    SQLITE_BUSY_TIMEOUT_MS,
    create_database_engine,
    create_session_factory,
)


def test_sqlite_engine_enables_concurrency_pragmas(tmp_path: Path) -> None:
    database_path = tmp_path / "nested" / "loreforge.sqlite3"
    engine = create_database_engine(f"sqlite:///{database_path}")

    try:
        session_factory = create_session_factory(engine)
        with session_factory() as session:
            journal_mode = session.execute(text("PRAGMA journal_mode")).scalar_one()
            busy_timeout = session.execute(text("PRAGMA busy_timeout")).scalar_one()
            foreign_keys = session.execute(text("PRAGMA foreign_keys")).scalar_one()

        assert database_path.parent.is_dir()
        assert journal_mode == "wal"
        assert busy_timeout == SQLITE_BUSY_TIMEOUT_MS
        assert foreign_keys == 1
    finally:
        engine.dispose()
