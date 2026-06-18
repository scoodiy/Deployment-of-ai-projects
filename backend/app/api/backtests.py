"""回测 API。"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.backtest import BacktestDetail, BacktestListResponse
from app.services import backtest_service

router = APIRouter(prefix="/api/backtests", tags=["回测"])


@router.get(
    "",
    response_model=BacktestListResponse,
    summary="回测列表",
    description="获取所有回测记录，可按策略和状态筛选，支持分页。",
)
def list_backtests(
    strategy_id: int | None = Query(None, description="策略 ID"),
    status: str | None = Query(None, description="状态 (pending/running/completed/failed)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
) -> BacktestListResponse:
    """返回回测列表。"""
    return backtest_service.get_backtests(
        db, strategy_id=strategy_id, status=status, page=page, page_size=page_size
    )


@router.get(
    "/{backtest_id}",
    response_model=BacktestDetail,
    summary="回测详情",
    description="获取指定回测的详细信息，包含所有交易记录。",
)
def backtest_detail(
    backtest_id: int,
    db: Session = Depends(get_db),
) -> BacktestDetail:
    """返回回测详情。"""
    detail = backtest_service.get_backtest_detail(db, backtest_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"回测 {backtest_id} 不存在")
    return detail
