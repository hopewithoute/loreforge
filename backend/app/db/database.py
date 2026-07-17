import sqlite3
from collections.abc import Generator
from pathlib import Path
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# Wait up to 5s before throwing "database is locked" errors
SQLITE_BUSY_TIMEOUT_MS = 5_000

# Allocate ~20MB of RAM for cache (negative number means KB)
SQLITE_CACHE_SIZE_KB = -20_000

# Store temporary tables/indices in RAM instead of disk
SQLITE_TEMP_STORE = "MEMORY"

# Use Memory-Mapped I/O for faster reads (up to 512MB)
SQLITE_MMAP_SIZE_BYTES = 512 * 1024 * 1024


def configure_sqlite(dbapi_connection: sqlite3.Connection, _connection_record: Any) -> None:
    """Configure SQLite PRAGMAs on connection."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute(f"PRAGMA busy_timeout={SQLITE_BUSY_TIMEOUT_MS}")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute(f"PRAGMA cache_size={SQLITE_CACHE_SIZE_KB}")
        cursor.execute(f"PRAGMA temp_store={SQLITE_TEMP_STORE}")
        cursor.execute(f"PRAGMA mmap_size={SQLITE_MMAP_SIZE_BYTES}")
    finally:
        cursor.close()


def _ensure_sqlite_parent(database_url: str) -> None:
    url = make_url(database_url)
    if url.get_backend_name() != "sqlite" or not url.database or url.database == ":memory:":
        return

    Path(url.database).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)


def create_database_engine(database_url: str) -> Engine:
    _ensure_sqlite_parent(database_url)
    is_sqlite = make_url(database_url).get_backend_name() == "sqlite"
    connect_args: dict[str, Any] = {"check_same_thread": False} if is_sqlite else {}
    engine = create_engine(database_url, connect_args=connect_args)

    if is_sqlite:
        event.listen(engine, "connect", configure_sqlite)

    return engine


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


engine = create_database_engine(settings.database_url)
SessionLocal = create_session_factory(engine)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
