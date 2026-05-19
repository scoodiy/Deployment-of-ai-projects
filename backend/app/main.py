from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
from .core.events import lifespan
from .api.v1 import users, trades, strategies, risk, stocks, crypto, qa

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/v1")
app.include_router(trades.router, prefix="/api/v1")
app.include_router(strategies.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(crypto.router, prefix="/api/v1")
app.include_router(qa.router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "quant-trading-bot"}
