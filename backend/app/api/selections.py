"""综合选股 API。"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import selection_service

router = APIRouter(prefix="/api/selections", tags=["综合选股"])


@router.post(
    "/run",
    summary="执行综合选股",
    description="根据多维度条件执行综合选股，支持基本面、技术指标和筹码分布条件筛选。",
)
def run_selection(
    # 基本面条件
    market: str | None = Query(None, description="市场 (SH/SZ/BJ)"),
    industry: str | None = Query(None, description="行业"),
    min_price: float | None = Query(None, description="最低价格"),
    max_price: float | None = Query(None, description="最高价格"),
    min_pct_change: float | None = Query(None, description="最小涨跌幅(%)"),
    max_pct_change: float | None = Query(None, description="最大涨跌幅(%)"),
    min_volume: float | None = Query(None, description="最小成交量"),
    min_turnover: float | None = Query(None, description="最小换手率(%)"),
    max_pe_ratio: float | None = Query(None, description="最大市盈率"),
    max_pb_ratio: float | None = Query(None, description="最大市净率"),
    min_market_cap: float | None = Query(None, description="最小总市值"),
    max_market_cap: float | None = Query(None, description="最大总市值"),
    # 技术指标条件
    macd_golden_cross: bool | None = Query(None, description="MACD 金叉"),
    kdj_golden_cross: bool | None = Query(None, description="KDJ 金叉"),
    rsi_oversold: bool | None = Query(None, description="RSI 超卖 (RSI6<30)"),
    rsi_overbought: bool | None = Query(None, description="RSI 超买 (RSI6>70)"),
    above_ma5: bool | None = Query(None, description="股价在5日均线之上"),
    above_ma20: bool | None = Query(None, description="股价在20日均线之上"),
    # 筹码条件
    min_winner_rate: float | None = Query(None, description="最小获利比例(%)"),
    max_concentration: float | None = Query(None, description="最大90%筹码集中度"),
    # 分页
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
) -> dict:
    """执行综合选股并返回结果。"""
    return selection_service.run_selection(
        db,
        market=market,
        industry=industry,
        min_price=min_price,
        max_price=max_price,
        min_pct_change=min_pct_change,
        max_pct_change=max_pct_change,
        min_volume=min_volume,
        min_turnover=min_turnover,
        max_pe_ratio=max_pe_ratio,
        max_pb_ratio=max_pb_ratio,
        min_market_cap=min_market_cap,
        max_market_cap=max_market_cap,
        macd_golden_cross=macd_golden_cross,
        kdj_golden_cross=kdj_golden_cross,
        rsi_oversold=rsi_oversold,
        rsi_overbought=rsi_overbought,
        above_ma5=above_ma5,
        above_ma20=above_ma20,
        min_winner_rate=min_winner_rate,
        max_concentration=max_concentration,
        page=page,
        page_size=page_size,
    )
