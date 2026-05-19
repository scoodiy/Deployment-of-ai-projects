from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up: initializing connections...")
    yield
    # Shutdown
    print("Shutting down: cleaning up connections...")
