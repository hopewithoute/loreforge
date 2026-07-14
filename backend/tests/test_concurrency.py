import asyncio
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.schema import Base
from app.models.asset import AssetCategory, AssetCreate, AssetStatus, AssetStyle
from app.providers.cloudflare_flux import CloudflareFluxAdapter
from app.services.asset_service import AssetService
from app.storage.local_storage import LocalStorageDriver
from app.workers.image_worker import _process_generation


def test_sqlite_concurrency():
    """
    Test that running multiple worker processes concurrently
    does not cause SQLite 'database is locked' errors.
    """
    # Create a real file-based database to test WAL and locks
    with tempfile.TemporaryDirectory() as temp_dir:
        db_path = Path(temp_dir) / "test.db"

        # Exact same engine args as in database.py
        engine = create_engine(
            f"sqlite:///{db_path}",
            connect_args={
                "check_same_thread": False,
                "timeout": 15,
            },
        )

        from sqlalchemy import event

        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=15000")
            cursor.close()

        Base.metadata.create_all(bind=engine)
        TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        storage = LocalStorageDriver()
        provider = CloudflareFluxAdapter()

        # Setup initial state
        with TestSessionLocal() as db:
            service = AssetService(db, storage)
            data1 = AssetCreate(
                prompt="concurrency 1", category=AssetCategory.character, style=AssetStyle.pixel_art
            )
            asset1 = service.create_asset("user1", data1)

            data2 = AssetCreate(
                prompt="concurrency 2", category=AssetCategory.prop, style=AssetStyle.isometric_rpg
            )
            asset2 = service.create_asset("user2", data2)
            db.commit()

            asset1_id = asset1.id
            asset2_id = asset2.id

        async def run_concurrently():
            session1 = TestSessionLocal()
            session2 = TestSessionLocal()

            service1 = AssetService(session1, storage)
            service2 = AssetService(session2, storage)

            # Run them at the exact same time
            await asyncio.gather(
                _process_generation(asset1_id, "user1", service1, storage, provider),
                _process_generation(asset2_id, "user2", service2, storage, provider),
            )

            session1.close()
            session2.close()

        asyncio.run(run_concurrently())

        # Verify both succeeded
        with TestSessionLocal() as db:
            updated1 = AssetService(db, storage).get_asset(asset1_id, "user1")
            updated2 = AssetService(db, storage).get_asset(asset2_id, "user2")

            assert updated1 is not None
            assert updated2 is not None
            assert updated1.status == AssetStatus.success
            assert updated2.status == AssetStatus.success


def test_same_asset_race_condition():
    """
    Test that updating the terminal state of the same asset
    is atomic and prevents lost updates/race conditions.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        db_path = Path(temp_dir) / "test.db"

        engine = create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False, "timeout": 15},
        )

        from sqlalchemy import event

        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=15000")
            cursor.close()

        Base.metadata.create_all(bind=engine)
        TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        storage = LocalStorageDriver()

        # Setup initial state
        with TestSessionLocal() as db:
            service = AssetService(db, storage)
            data1 = AssetCreate(
                prompt="race condition 1",
                category=AssetCategory.character,
                style=AssetStyle.pixel_art,
            )
            asset1 = service.create_asset("user1", data1)
            db.commit()
            asset1_id = asset1.id

        async def run_race():
            session1 = TestSessionLocal()
            session2 = TestSessionLocal()

            service1 = AssetService(session1, storage)
            service2 = AssetService(session2, storage)

            # Both try to transition from pending to a terminal state at the exact same time
            async def worker1():
                return await asyncio.to_thread(
                    service1.mark_as_success,
                    asset1_id,
                    "user1",
                    "/test/path.png",
                    {"provider_name": "test"},
                )

            async def worker2():
                return await asyncio.to_thread(
                    service2.mark_as_failed, asset1_id, "user1", "ERR_1", "Error 1"
                )

            await asyncio.gather(worker1(), worker2())

            session1.close()
            session2.close()

        asyncio.run(run_race())

        # Verify exactly one succeeded and didn't overwrite the other's fields
        with TestSessionLocal() as db:
            final_asset = AssetService(db, storage).get_asset(asset1_id, "user1")
            assert final_asset is not None

            # If the transition was not atomic, it might end up with status=failed
            # BUT have generated_image_path set (a mix of both updates).
            if final_asset.status == AssetStatus.success:
                assert final_asset.generated_image_path == "/test/path.png"
                assert final_asset.error_code is None
                assert final_asset.error_message is None
            elif final_asset.status == AssetStatus.failed:
                assert final_asset.error_code == "ERR_1"
                assert final_asset.error_message == "Error 1"
                assert final_asset.generated_image_path is None
            else:
                pytest.fail(f"Unexpected final status: {final_asset.status}")
