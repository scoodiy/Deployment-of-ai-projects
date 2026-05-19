from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    from ..db.base import init_db, close_db, is_database_available

    # Startup
    print("[lifespan] Starting up...")
    await init_db()

    if is_database_available():
        from ..db.seed import seed_admin_user
        await seed_admin_user()
        print("[lifespan] Database mode ready.")
    else:
        from ..db.memory import get_memory_store
        get_memory_store().initialize()
        print("[lifespan] Memory storage mode ready.")

    yield

    # Shutdown
    print("[lifespan] Shutting down...")
    await close_db()
    print("[lifespan] Shutdown complete.")
