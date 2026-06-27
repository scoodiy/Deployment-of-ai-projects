"""综合选股业务逻辑。"""

from datetime import date

from sqlalchemy import and_, case, desc, func, or_
from sqlalchemy.orm import Session

from app.models.stock import Stock, StockCyq, StockIndicator, StockListItem, StockRealtime


def run_selection(
    db: Session,
    *,
    market: str | None = None,
    industry: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_pct_change: float | None = None,
    max_pct_change: float | None = None,
    min_volume: float | None = None,
    min_turnover: float | None = None,
    max_pe_ratio: float | None = None,
    max_pb_ratio: float | None = None,
    min_market_cap: float | None = None,
    max_market_cap: float | None = None,
    # 技术指标条件
    macd_golden_cross: bool | None = None,
    kdj_golden_cross: bool | None = None,
    rsi_oversold: bool | None = None,
    rsi_overbought: bool | None = None,
    above_ma5: bool | None = None,
    above_ma20: bool | None = None,
    # 筹码条件
    min_winner_rate: float | None = None,
    max_concentration: float | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """综合选股，支持多维度条件筛选。"""
    query = (
        db.query(Stock, StockRealtime)
        .outerjoin(StockRealtime, Stock.code == StockRealtime.code)
        .filter(Stock.is_active == True)
    )

    if market:
        query = query.filter(Stock.market == market)
    if industry:
        query = query.filter(Stock.industry == industry)

    # 实时行情条件
    if min_price is not None:
        query = query.filter(StockRealtime.price >= min_price)
    if max_price is not None:
        query = query.filter(StockRealtime.price <= max_price)
    if min_pct_change is not None:
        query = query.filter(StockRealtime.pct_change >= min_pct_change)
    if max_pct_change is not None:
        query = query.filter(StockRealtime.pct_change <= max_pct_change)
    if min_volume is not None:
        query = query.filter(StockRealtime.volume >= min_volume)
    if min_turnover is not None:
        query = query.filter(StockRealtime.turnover >= min_turnover)
    if max_pe_ratio is not None:
        query = query.filter(
            StockRealtime.pe_ratio.isnot(None),
            StockRealtime.pe_ratio > 0,
            StockRealtime.pe_ratio <= max_pe_ratio,
        )
    if max_pb_ratio is not None:
        query = query.filter(
            StockRealtime.pb_ratio.isnot(None),
            StockRealtime.pb_ratio > 0,
            StockRealtime.pb_ratio <= max_pb_ratio,
        )
    if min_market_cap is not None:
        query = query.filter(StockRealtime.market_cap >= min_market_cap)
    if max_market_cap is not None:
        query = query.filter(StockRealtime.market_cap <= max_market_cap)

    # 技术指标条件 — 使用子查询获取最新指标日
    if any([macd_golden_cross, kdj_golden_cross, rsi_oversold, rsi_overbought,
            above_ma5, above_ma20]):
        latest_ind_subq = (
            db.query(
                StockIndicator.code,
                func.max(StockIndicator.trade_date).label("max_date"),
            )
            .group_by(StockIndicator.code)
            .subquery()
        )
        ind_alias = db.query(StockIndicator).join(
            latest_ind_subq,
            and_(
                StockIndicator.code == latest_ind_subq.c.code,
                StockIndicator.trade_date == latest_ind_subq.c.max_date,
            ),
        ).subquery()

        query = query.join(ind_alias, Stock.code == ind_alias.c.code)

        if macd_golden_cross:
            query = query.filter(
                ind_alias.c.macd_dif > ind_alias.c.macd_dea,
                ind_alias.c.macd_hist > 0,
            )
        if kdj_golden_cross:
            query = query.filter(ind_alias.c.kdj_k > ind_alias.c.kdj_d)
        if rsi_oversold:
            query = query.filter(ind_alias.c.rsi6 < 30)
        if rsi_overbought:
            query = query.filter(ind_alias.c.rsi6 > 70)
        if above_ma5:
            query = query.filter(StockRealtime.price > ind_alias.c.ma5)
        if above_ma20:
            query = query.filter(StockRealtime.price > ind_alias.c.ma20)

    # 筹码条件
    if min_winner_rate is not None or max_concentration is not None:
        latest_cyq_subq = (
            db.query(
                StockCyq.code,
                func.max(StockCyq.trade_date).label("max_date"),
            )
            .group_by(StockCyq.code)
            .subquery()
        )
        cyq_alias = db.query(
            StockCyq.code,
            func.avg(StockCyq.winner_rate).label("avg_winner"),
            func.avg(StockCyq.concentration_90).label("avg_conc"),
        ).join(
            latest_cyq_subq,
            and_(
                StockCyq.code == latest_cyq_subq.c.code,
                StockCyq.trade_date == latest_cyq_subq.c.max_date,
            ),
        ).group_by(StockCyq.code).subquery()

        query = query.join(cyq_alias, Stock.code == cyq_alias.c.code)

        if min_winner_rate is not None:
            query = query.filter(cyq_alias.c.avg_winner >= min_winner_rate)
        if max_concentration is not None:
            query = query.filter(cyq_alias.c.avg_conc <= max_concentration)

    query = query.order_by(desc(StockRealtime.pct_change))
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        StockListItem(
            code=r.Stock.code,
            name=r.Stock.name,
            market=r.Stock.market,
            industry=r.Stock.industry,
            price=r.StockRealtime.price if r.StockRealtime else None,
            pct_change=r.StockRealtime.pct_change if r.StockRealtime else None,
            volume=r.StockRealtime.volume if r.StockRealtime else None,
            amount=r.StockRealtime.amount if r.StockRealtime else None,
            turnover=r.StockRealtime.turnover if r.StockRealtime else None,
            pe_ratio=r.StockRealtime.pe_ratio if r.StockRealtime else None,
            market_cap=r.StockRealtime.market_cap if r.StockRealtime else None,
        )
        for r in rows
    ]

    return {"total": total, "items": items, "page": page, "page_size": page_size}
