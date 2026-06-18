"""选股策略业务逻辑。"""

from datetime import date

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.strategy import (
    Strategy,
    StrategyInfo,
    StrategyListResponse,
    StrategyResult,
    StrategyResultItem,
    StrategyResultResponse,
)


def get_strategies(
    db: Session,
    *,
    strategy_type: str | None = None,
    is_active: bool | None = None,
) -> StrategyListResponse:
    """获取策略列表。"""
    query = db.query(Strategy)

    if strategy_type:
        query = query.filter(Strategy.strategy_type == strategy_type)
    if is_active is not None:
        query = query.filter(Strategy.is_active == is_active)

    query = query.order_by(Strategy.id)
    items = query.all()

    return StrategyListResponse(
        total=len(items),
        items=[StrategyInfo.model_validate(s) for s in items],
    )


def get_strategy_results(
    db: Session,
    strategy_id: int,
    trade_date: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> StrategyResultResponse | None:
    """获取策略选股结果。"""
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        return None

    query = (
        db.query(StrategyResult)
        .filter(StrategyResult.strategy_id == strategy_id)
    )

    if trade_date:
        query = query.filter(StrategyResult.trade_date == trade_date)

    query = query.order_by(desc(StrategyResult.score), desc(StrategyResult.trade_date))
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    return StrategyResultResponse(
        strategy=StrategyInfo.model_validate(strategy),
        total=total,
        items=[StrategyResultItem.model_validate(r) for r in rows],
    )
