"""股票数据业务逻辑。"""

from datetime import date, timedelta

from sqlalchemy import desc, or_, func
from sqlalchemy.orm import Session

from app.models.stock import (
    CyqData,
    IndicatorData,
    KlineData,
    PatternData,
    Stock,
    StockCyq,
    StockDaily,
    StockDetail,
    StockIndicator,
    StockListItem,
    StockPattern,
    StockRealtime,
)


def get_stock_list(
    db: Session,
    *,
    keyword: str | None = None,
    market: str | None = None,
    industry: str | None = None,
    sort_by: str = "code",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """获取股票列表（含实时行情），支持搜索、筛选、排序、分页。"""
    query = (
        db.query(Stock, StockRealtime)
        .outerjoin(StockRealtime, Stock.code == StockRealtime.code)
        .filter(Stock.is_active == True)
    )

    if keyword:
        like_pattern = f"%{keyword}%"
        query = query.filter(
            or_(Stock.code.like(like_pattern), Stock.name.like(like_pattern))
        )
    if market:
        query = query.filter(Stock.market == market)
    if industry:
        query = query.filter(Stock.industry == industry)

    # 排序
    sort_columns = {
        "code": Stock.code,
        "name": Stock.name,
        "price": StockRealtime.price,
        "pct_change": StockRealtime.pct_change,
        "volume": StockRealtime.volume,
        "amount": StockRealtime.amount,
        "turnover": StockRealtime.turnover,
        "market_cap": StockRealtime.market_cap,
        "pe_ratio": StockRealtime.pe_ratio,
    }
    sort_col = sort_columns.get(sort_by, Stock.code)
    order = desc(sort_col) if sort_order == "desc" else sort_col.asc()
    query = query.order_by(order)

    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        StockListItem(
            code=r.Stock.code,
            name=r.Stock.name,
            market=r.Stock.market,
            industry=r.Stock.industry,
            is_active=r.Stock.is_active,
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


def get_stock_detail(db: Session, code: str) -> StockDetail | None:
    """获取单只股票详情（基本面 + 实时行情）。"""
    row = (
        db.query(Stock, StockRealtime)
        .outerjoin(StockRealtime, Stock.code == StockRealtime.code)
        .filter(Stock.code == code)
        .first()
    )
    if not row:
        return None

    stock, rt = row
    return StockDetail(
        code=stock.code,
        name=stock.name,
        market=stock.market,
        industry=stock.industry,
        sector=stock.sector,
        is_active=stock.is_active,
        list_date=stock.list_date,
        total_share=stock.total_share,
        float_share=stock.float_share,
        price=rt.price if rt else None,
        pct_change=rt.pct_change if rt else None,
        open=rt.open if rt else None,
        high=rt.high if rt else None,
        low=rt.low if rt else None,
        pre_close=rt.pre_close if rt else None,
        volume=rt.volume if rt else None,
        amount=rt.amount if rt else None,
        turnover=rt.turnover if rt else None,
        pe_ratio=rt.pe_ratio if rt else None,
        pb_ratio=rt.pb_ratio if rt else None,
        market_cap=rt.market_cap if rt else None,
        float_market_cap=rt.float_market_cap if rt else None,
    )


def get_kline_data(
    db: Session,
    code: str,
    start_date: date | None = None,
    end_date: date | None = None,
    period: int = 120,
) -> list[KlineData]:
    """获取 K 线数据。"""
    query = db.query(StockDaily).filter(StockDaily.code == code)

    if start_date:
        query = query.filter(StockDaily.trade_date >= start_date)
    if end_date:
        query = query.filter(StockDaily.trade_date <= end_date)

    if not start_date:
        latest = (
            db.query(func.max(StockDaily.trade_date))
            .filter(StockDaily.code == code)
            .scalar()
        )
        if latest:
            query = query.filter(StockDaily.trade_date >= latest - timedelta(days=period * 2))

    query = query.order_by(StockDaily.trade_date)
    rows = query.all()

    return [
        KlineData(
            trade_date=r.trade_date,
            open=r.open,
            high=r.high,
            low=r.low,
            close=r.close,
            volume=r.volume,
            amount=r.amount,
            turnover=r.turnover,
            pct_change=r.pct_change,
        )
        for r in rows
    ]


def get_indicators(
    db: Session,
    code: str,
    start_date: date | None = None,
    end_date: date | None = None,
    period: int = 120,
) -> list[IndicatorData]:
    """获取技术指标数据。"""
    query = db.query(StockIndicator).filter(StockIndicator.code == code)

    if start_date:
        query = query.filter(StockIndicator.trade_date >= start_date)
    if end_date:
        query = query.filter(StockIndicator.trade_date <= end_date)

    if not start_date:
        latest = (
            db.query(func.max(StockIndicator.trade_date))
            .filter(StockIndicator.code == code)
            .scalar()
        )
        if latest:
            query = query.filter(
                StockIndicator.trade_date >= latest - timedelta(days=period * 2)
            )

    query = query.order_by(StockIndicator.trade_date)
    rows = query.all()

    return [
        IndicatorData(
            trade_date=r.trade_date,
            ma5=r.ma5,
            ma10=r.ma10,
            ma20=r.ma20,
            ma60=r.ma60,
            ma120=r.ma120,
            ma250=r.ma250,
            macd_dif=r.macd_dif,
            macd_dea=r.macd_dea,
            macd_hist=r.macd_hist,
            kdj_k=r.kdj_k,
            kdj_d=r.kdj_d,
            kdj_j=r.kdj_j,
            rsi6=r.rsi6,
            rsi12=r.rsi12,
            rsi24=r.rsi24,
            boll_upper=r.boll_upper,
            boll_mid=r.boll_mid,
            boll_lower=r.boll_lower,
            vol_ma5=r.vol_ma5,
            vol_ma10=r.vol_ma10,
            atr=r.atr,
            cci=r.cci,
            wr=r.wr,
            obv=r.obv,
        )
        for r in rows
    ]


def get_patterns(
    db: Session,
    code: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[PatternData]:
    """获取 K 线形态识别结果。"""
    query = db.query(StockPattern).filter(StockPattern.code == code)

    if start_date:
        query = query.filter(StockPattern.trade_date >= start_date)
    if end_date:
        query = query.filter(StockPattern.trade_date <= end_date)

    query = query.order_by(desc(StockPattern.trade_date))
    rows = query.limit(100).all()

    return [
        PatternData(
            trade_date=r.trade_date,
            pattern_name=r.pattern_name,
            pattern_type=r.pattern_type,
            signal=r.signal,
            confidence=r.confidence,
            description=r.description,
        )
        for r in rows
    ]


def get_cyq_data(
    db: Session,
    code: str,
    trade_date: date | None = None,
) -> list[CyqData]:
    """获取筹码分布数据。"""
    query = db.query(StockCyq).filter(StockCyq.code == code)

    if trade_date:
        query = query.filter(StockCyq.trade_date == trade_date)
    else:
        latest = (
            db.query(func.max(StockCyq.trade_date))
            .filter(StockCyq.code == code)
            .scalar()
        )
        if latest:
            query = query.filter(StockCyq.trade_date == latest)

    query = query.order_by(StockCyq.price)
    rows = query.all()

    return [
        CyqData(
            trade_date=r.trade_date,
            price=r.price,
            percent=r.percent,
            avg_cost=r.avg_cost,
            concentration_90=r.concentration_90,
            concentration_70=r.concentration_70,
            winner_rate=r.winner_rate,
        )
        for r in rows
    ]


def get_industries(db: Session) -> list[str]:
    """获取所有行业列表。"""
    rows = (
        db.query(Stock.industry)
        .filter(Stock.is_active == True, Stock.industry.isnot(None))
        .distinct()
        .order_by(Stock.industry)
        .all()
    )
    return [r[0] for r in rows]
