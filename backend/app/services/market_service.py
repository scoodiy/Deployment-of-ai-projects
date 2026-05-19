"""市场概览业务逻辑。"""

from datetime import date

from sqlalchemy import case, func, desc
from sqlalchemy.orm import Session

from app.models.stock import Stock, StockDaily, StockRealtime, StockListItem, MarketOverview


def get_market_overview(db: Session) -> MarketOverview:
    """获取市场概览数据。

    聚合实时行情数据，统计涨跌家数、成交额，以及涨幅/跌幅/成交量 Top 10。
    """
    # 涨跌统计
    stats = db.query(
        func.count().label("total"),
        func.sum(case((StockRealtime.pct_change > 0, 1), else_=0)).label("up_count"),
        func.sum(case((StockRealtime.pct_change < 0, 1), else_=0)).label("down_count"),
        func.sum(case((StockRealtime.pct_change == 0, 1), else_=0)).label("flat_count"),
        func.coalesce(func.sum(StockRealtime.amount), 0).label("total_amount"),
        func.coalesce(func.avg(StockRealtime.pct_change), 0).label("avg_pct_change"),
    ).first()

    total = stats.total or 0
    up_count = int(stats.up_count or 0)
    down_count = int(stats.down_count or 0)
    flat_count = int(stats.flat_count or 0)
    total_amount = float(stats.total_amount or 0)
    avg_pct_change = float(stats.avg_pct_change or 0)

    def _top_stocks(order_col, limit: int = 10) -> list[StockListItem]:
        rows = (
            db.query(StockRealtime, Stock)
            .join(Stock, Stock.code == StockRealtime.code)
            .filter(Stock.is_active == True)
            .order_by(desc(order_col))
            .limit(limit)
            .all()
        )
        return [
            StockListItem(
                code=r.Stock.code,
                name=r.Stock.name,
                market=r.Stock.market,
                industry=r.Stock.industry,
                price=r.StockRealtime.price,
                pct_change=r.StockRealtime.pct_change,
                volume=r.StockRealtime.volume,
                amount=r.StockRealtime.amount,
                turnover=r.StockRealtime.turnover,
                pe_ratio=r.StockRealtime.pe_ratio,
                market_cap=r.StockRealtime.market_cap,
            )
            for r in rows
        ]

    top_gainers = _top_stocks(StockRealtime.pct_change)
    top_losers = _top_stocks(StockRealtime.pct_change.asc())
    top_volume = _top_stocks(StockRealtime.amount)

    # 大盘指数 (上证/深证/创业板)
    index_codes = ["000001", "399001", "399006"]
    market_indices = []
    for idx_code in index_codes:
        idx = db.query(StockRealtime).filter(StockRealtime.code == idx_code).first()
        if idx:
            market_indices.append({
                "code": idx.code,
                "name": idx.name,
                "price": idx.price,
                "pct_change": idx.pct_change,
                "change_amount": idx.change_amount,
                "volume": idx.volume,
                "amount": idx.amount,
            })

    return MarketOverview(
        total_stocks=total,
        up_count=up_count,
        down_count=down_count,
        flat_count=flat_count,
        total_amount=total_amount,
        avg_pct_change=round(avg_pct_change, 2),
        top_gainers=top_gainers,
        top_losers=top_losers,
        top_volume=top_volume,
        market_indices=market_indices,
    )
