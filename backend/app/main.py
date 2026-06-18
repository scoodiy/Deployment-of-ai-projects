"""Stock-AYUU 后端入口。

基于 FastAPI 的股票数据分析与可视化平台后端。
绝对不允许任何自动交易功能。
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine

logger = logging.getLogger("stock-ayuu")
settings = get_settings()

# ── 启动安全检查 ──────────────────────────────────────────────

_BLOCKED_MODULES = {"easytrader", "trader", "trade"}
_BLOCKED_APIS = {"/api/trade", "/api/order", "/api/buy", "/api/sell",
                 "/api/cancel", "/api/ipo", "/api/broker",
                 "/api/account", "/api/balance", "/api/position"}


def _check_blocked_modules() -> None:
    """启动时检查并阻止交易模块加载。"""
    for mod_name in _BLOCKED_MODULES:
        if mod_name in sys.modules:
            logger.critical("检测到禁止的交易模块 '%s' 已加载，终止启动。", mod_name)
            sys.exit(1)


# ── 生命周期 ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理。"""
    _check_blocked_modules()
    logger.info("Stock-AYUU 后端启动中...")
    # 创建数据库表（如不存在）
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表检查完成。")
    yield
    logger.info("Stock-AYUU 后端已停止。")


# ── 创建 FastAPI 实例 ─────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description="股票数据分析与可视化平台 API。仅用于数据分析、策略研究和回测展示，不提供任何交易功能。",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS 中间件 ───────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 注册路由 ──────────────────────────────────────────────────

from app.api import backtests, chat, data, market, selections, stocks, strategies, watchlist

app.include_router(market.router)
app.include_router(stocks.router)
app.include_router(strategies.router)
app.include_router(backtests.router)
app.include_router(selections.router)
app.include_router(watchlist.router)
app.include_router(chat.router)
app.include_router(data.router)


# ── 健康检查 ──────────────────────────────────────────────────

@app.get("/api/health", tags=["系统"])
def health_check() -> dict:
    """健康检查端点。"""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
    }


# ── 根路径 ────────────────────────────────────────────────────

@app.get("/", tags=["系统"])
def root() -> dict:
    """根路径，返回服务信息。"""
    return {
        "service": settings.APP_NAME,
        "docs": "/docs",
        "health": "/api/health",
        "disclaimer": "本网站仅用于股票数据分析、策略研究和回测展示，不构成任何投资建议，不提供自动交易或委托下单服务。",
    }


# ── 日志配置 ──────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
