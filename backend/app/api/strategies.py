"""选股策略 API。"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.strategy import StrategyListResponse, StrategyResultResponse
from app.services import strategy_service

router = APIRouter(prefix="/api/strategies", tags=["选股策略"])


@router.get(
    "",
    response_model=StrategyListResponse,
    summary="策略列表",
    description="获取所有选股策略，可按类型和启用状态筛选。",
)
def list_strategies(
    strategy_type: str | None = Query(None, description="策略类型"),
    is_active: bool | None = Query(None, description="是否启用"),
    db: Session = Depends(get_db),
) -> StrategyListResponse:
    """返回策略列表。"""
    return strategy_service.get_strategies(db, strategy_type=strategy_type, is_active=is_active)


@router.get(
    "/{strategy_id}/results",
    response_model=StrategyResultResponse,
    summary="策略选股结果",
    description="获取指定策略的选股结果，支持按日期筛选和分页。",
)
def strategy_results(
    strategy_id: int,
    trade_date: date | None = Query(None, description="选股日期"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
) -> StrategyResultResponse:
    """返回策略选股结果。"""
    result = strategy_service.get_strategy_results(
        db, strategy_id, trade_date=trade_date, page=page, page_size=page_size
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"策略 {strategy_id} 不存在")
    return result
