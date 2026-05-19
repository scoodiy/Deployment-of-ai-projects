from contextlib import asynccontextmanager
from fastapi import FastAPI

from ..db.base import init_db, close_db
from ..db.seed import seed_admin_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[lifespan] Starting up: initializing database...")
    await init_db()
    await seed_admin_user()
    print("[lifespan] Database ready.")
    yield
    # Shutdown
    print("[lifespan] Shutting down: closing database connections...")
    await close_db()
    print("[lifespan] Shutdown complete.")
