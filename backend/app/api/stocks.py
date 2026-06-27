"""股票相关 API。"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.stock import (
    CyqData,
    IndicatorData,
    KlineData,
    PatternData,
    StockDetail,
    StockListItem,
    StockListResponse,
)
from app.services import stock_service

router = APIRouter(prefix="/api/stocks", tags=["股票"])


@router.get(
    "",
    response_model=StockListResponse,
    summary="股票列表",
    description="获取股票列表，支持关键词搜索、市场/行业筛选、排序和分页。",
)
def list_stocks(
    keyword: str | None = Query(None, description="搜索关键词（代码或名称）"),
    market: str | None = Query(None, description="市场 (SH/SZ/BJ)"),
    industry: str | None = Query(None, description="行业"),
    sort_by: str = Query("code", description="排序字段"),
    sort_order: str = Query("asc", description="排序方向 (asc/desc)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
) -> StockListResponse:
    """返回股票列表及实时行情。"""
    return stock_service.get_stock_list(
        db,
        keyword=keyword,
        market=market,
        industry=industry,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/industries",
    summary="行业列表",
    description="获取所有行业列表，用于筛选下拉框。",
)
def list_industries(db: Session = Depends(get_db)) -> list[str]:
    """返回所有行业名称。"""
    return stock_service.get_industries(db)


@router.get(
    "/{code}",
    response_model=StockDetail,
    summary="个股详情",
    description="获取单只股票的基本信息和实时行情。",
)
def stock_detail(code: str, db: Session = Depends(get_db)) -> StockDetail:
    """返回指定股票的详情。"""
    detail = stock_service.get_stock_detail(db, code)
    if not detail:
        raise HTTPException(status_code=404, detail=f"股票 {code} 不存在")
    return detail


@router.get(
    "/{code}/kline",
    response_model=list[KlineData],
    summary="K线数据",
    description="获取指定股票的历史 K 线数据（日线）。",
)
def stock_kline(
    code: str,
    start_date: date | None = Query(None, description="开始日期"),
    end_date: date | None = Query(None, description="结束日期"),
    period: int = Query(120, description="默认获取最近 N 个交易日"),
    db: Session = Depends(get_db),
) -> list[KlineData]:
    """返回 K 线数据列表。"""
    return stock_service.get_kline_data(db, code, start_date, end_date, period)


@router.get(
    "/{code}/indicators",
    response_model=list[IndicatorData],
    summary="技术指标",
    description="获取指定股票的技术指标数据（MA、MACD、KDJ、RSI、BOLL 等）。",
)
def stock_indicators(
    code: str,
    start_date: date | None = Query(None, description="开始日期"),
    end_date: date | None = Query(None, description="结束日期"),
    period: int = Query(120, description="默认获取最近 N 个交易日"),
    db: Session = Depends(get_db),
) -> list[IndicatorData]:
    """返回技术指标数据列表。"""
    return stock_service.get_indicators(db, code, start_date, end_date, period)


@router.get(
    "/{code}/patterns",
    response_model=list[PatternData],
    summary="K线形态",
    description="获取指定股票的 K 线形态识别结果。",
)
def stock_patterns(
    code: str,
    start_date: date | None = Query(None, description="开始日期"),
    end_date: date | None = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
) -> list[PatternData]:
    """返回 K 线形态识别结果列表。"""
    return stock_service.get_patterns(db, code, start_date, end_date)


@router.get(
    "/{code}/cyq",
    response_model=list[CyqData],
    summary="筹码分布",
    description="获取指定股票的筹码分布数据。",
)
def stock_cyq(
    code: str,
    trade_date: date | None = Query(None, description="指定日期，默认最新"),
    db: Session = Depends(get_db),
) -> list[CyqData]:
    """返回筹码分布数据列表。"""
    return stock_service.get_cyq_data(db, code, trade_date)
