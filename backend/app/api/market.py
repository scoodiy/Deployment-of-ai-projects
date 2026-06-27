"""市场概览 API。"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.stock import MarketOverview
from app.services import market_service

router = APIRouter(prefix="/api/market", tags=["市场概览"])


@router.get(
    "/overview",
    response_model=MarketOverview,
    summary="市场概览",
    description="获取市场整体概况：涨跌家数、成交额、涨跌幅/成交量 Top 10、大盘指数。",
)
def market_overview(db: Session = Depends(get_db)) -> MarketOverview:
    """返回市场概览数据。"""
    return market_service.get_market_overview(db)
