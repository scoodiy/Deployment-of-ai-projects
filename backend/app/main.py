from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .core.config import get_settings
from .core.events import lifespan
from .api.v1 import users, trades, strategies, risk, stocks, crypto, qa
from .db.base import async_session

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting (slowapi) ---
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": f"Rate limit exceeded: {exc.detail}"},
        )
except ImportError:
    limiter = None  # slowapi not installed, skip rate limiting


# --- Routers ---
app.include_router(users.router, prefix="/api/v1")
app.include_router(trades.router, prefix="/api/v1")
app.include_router(strategies.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(crypto.router, prefix="/api/v1")
app.include_router(qa.router, prefix="/api/v1")


# --- Health check ---
@app.get("/health")
async def health():
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "service": "quant-trading-bot", "db": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "service": "quant-trading-bot", "db": str(e)},
        )
