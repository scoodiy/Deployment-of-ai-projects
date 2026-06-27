"""回测业务逻辑。"""

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.backtest import (
    Backtest,
    BacktestDetail,
    BacktestInfo,
    BacktestListResponse,
    BacktestTrade,
    BacktestTradeItem,
)


def get_backtests(
    db: Session,
    *,
    strategy_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> BacktestListResponse:
    """获取回测列表。"""
    query = db.query(Backtest)

    if strategy_id:
        query = query.filter(Backtest.strategy_id == strategy_id)
    if status:
        query = query.filter(Backtest.status == status)

    query = query.order_by(desc(Backtest.created_at))
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    return BacktestListResponse(
        total=total,
        items=[BacktestInfo.model_validate(r) for r in rows],
    )


def get_backtest_detail(db: Session, backtest_id: int) -> BacktestDetail | None:
    """获取回测详情（含交易记录）。"""
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
    if not backtest:
        return None

    trades = (
        db.query(BacktestTrade)
        .filter(BacktestTrade.backtest_id == backtest_id)
        .order_by(BacktestTrade.trade_date)
        .all()
    )

    detail = BacktestDetail.model_validate(backtest)
    detail.trades = [BacktestTradeItem.model_validate(t) for t in trades]
    return detail
