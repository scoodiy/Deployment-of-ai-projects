"""股票相关数据模型。"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Stock(Base):
    """股票基本信息表。"""

    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, comment="股票代码")
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="股票名称")
    market: Mapped[str] = mapped_column(String(10), nullable=False, comment="市场 (SH/SZ/BJ)")
    industry: Mapped[Optional[str]] = mapped_column(String(50), comment="所属行业")
    sector: Mapped[Optional[str]] = mapped_column(String(50), comment="所属板块")
    list_date: Mapped[Optional[date]] = mapped_column(Date, comment="上市日期")
    delist_date: Mapped[Optional[date]] = mapped_column(Date, comment="退市日期")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否在市")
    total_share: Mapped[Optional[float]] = mapped_column(Float, comment="总股本(万股)")
    float_share: Mapped[Optional[float]] = mapped_column(Float, comment="流通股本(万股)")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间"
    )

    __table_args__ = (
        Index("idx_stocks_market", "market"),
        Index("idx_stocks_industry", "industry"),
        {"comment": "股票基本信息表"},
    )


class StockDaily(Base):
    """股票日线数据表。"""

    __tablename__ = "stock_daily"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, comment="交易日期")
    open: Mapped[float] = mapped_column(Float, nullable=False, comment="开盘价")
    high: Mapped[float] = mapped_column(Float, nullable=False, comment="最高价")
    low: Mapped[float] = mapped_column(Float, nullable=False, comment="最低价")
    close: Mapped[float] = mapped_column(Float, nullable=False, comment="收盘价")
    volume: Mapped[float] = mapped_column(Float, comment="成交量(手)")
    amount: Mapped[float] = mapped_column(Float, comment="成交额(元)")
    turnover: Mapped[Optional[float]] = mapped_column(Float, comment="换手率(%)")
    pct_change: Mapped[Optional[float]] = mapped_column(Float, comment="涨跌幅(%)")
    amplitude: Mapped[Optional[float]] = mapped_column(Float, comment="振幅(%)")

    __table_args__ = (
        Index("idx_daily_code_date", "code", "trade_date", unique=True),
        Index("idx_daily_date", "trade_date"),
        {"comment": "股票日线数据表"},
    )


class StockRealtime(Base):
    """股票实时行情表。"""

    __tablename__ = "stock_realtime"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    name: Mapped[str] = mapped_column(String(50), comment="股票名称")
    price: Mapped[float] = mapped_column(Float, nullable=False, comment="最新价")
    pct_change: Mapped[float] = mapped_column(Float, comment="涨跌幅(%)")
    change_amount: Mapped[float] = mapped_column(Float, comment="涨跌额")
    volume: Mapped[float] = mapped_column(Float, comment="成交量(手)")
    amount: Mapped[float] = mapped_column(Float, comment="成交额(元)")
    open: Mapped[float] = mapped_column(Float, comment="开盘价")
    high: Mapped[float] = mapped_column(Float, comment="最高价")
    low: Mapped[float] = mapped_column(Float, comment="最低价")
    pre_close: Mapped[float] = mapped_column(Float, comment="昨收价")
    turnover: Mapped[Optional[float]] = mapped_column(Float, comment="换手率(%)")
    pe_ratio: Mapped[Optional[float]] = mapped_column(Float, comment="市盈率")
    pb_ratio: Mapped[Optional[float]] = mapped_column(Float, comment="市净率")
    market_cap: Mapped[Optional[float]] = mapped_column(Float, comment="总市值(元)")
    float_market_cap: Mapped[Optional[float]] = mapped_column(Float, comment="流通市值(元)")
    update_time: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间"
    )

    __table_args__ = (
        Index("idx_realtime_code", "code", unique=True),
        {"comment": "股票实时行情表"},
    )


class StockIndicator(Base):
    """技术指标数据表。"""

    __tablename__ = "stock_indicators"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, comment="交易日期")
    # 均线
    ma5: Mapped[Optional[float]] = mapped_column(Float, comment="5日均线")
    ma10: Mapped[Optional[float]] = mapped_column(Float, comment="10日均线")
    ma20: Mapped[Optional[float]] = mapped_column(Float, comment="20日均线")
    ma60: Mapped[Optional[float]] = mapped_column(Float, comment="60日均线")
    ma120: Mapped[Optional[float]] = mapped_column(Float, comment="120日均线")
    ma250: Mapped[Optional[float]] = mapped_column(Float, comment="250日均线")
    # MACD
    macd_dif: Mapped[Optional[float]] = mapped_column(Float, comment="MACD DIF")
    macd_dea: Mapped[Optional[float]] = mapped_column(Float, comment="MACD DEA")
    macd_hist: Mapped[Optional[float]] = mapped_column(Float, comment="MACD 柱状")
    # KDJ
    kdj_k: Mapped[Optional[float]] = mapped_column(Float, comment="KDJ K值")
    kdj_d: Mapped[Optional[float]] = mapped_column(Float, comment="KDJ D值")
    kdj_j: Mapped[Optional[float]] = mapped_column(Float, comment="KDJ J值")
    # RSI
    rsi6: Mapped[Optional[float]] = mapped_column(Float, comment="RSI 6日")
    rsi12: Mapped[Optional[float]] = mapped_column(Float, comment="RSI 12日")
    rsi24: Mapped[Optional[float]] = mapped_column(Float, comment="RSI 24日")
    # BOLL
    boll_upper: Mapped[Optional[float]] = mapped_column(Float, comment="布林上轨")
    boll_mid: Mapped[Optional[float]] = mapped_column(Float, comment="布林中轨")
    boll_lower: Mapped[Optional[float]] = mapped_column(Float, comment="布林下轨")
    # 量能
    vol_ma5: Mapped[Optional[float]] = mapped_column(Float, comment="5日量均线")
    vol_ma10: Mapped[Optional[float]] = mapped_column(Float, comment="10日量均线")
    # 其他
    ema12: Mapped[Optional[float]] = mapped_column(Float, comment="EMA12")
    ema26: Mapped[Optional[float]] = mapped_column(Float, comment="EMA26")
    atr: Mapped[Optional[float]] = mapped_column(Float, comment="ATR")
    cci: Mapped[Optional[float]] = mapped_column(Float, comment="CCI")
    wr: Mapped[Optional[float]] = mapped_column(Float, comment="WR")
    obv: Mapped[Optional[float]] = mapped_column(Float, comment="OBV")

    __table_args__ = (
        Index("idx_indicator_code_date", "code", "trade_date", unique=True),
        Index("idx_indicator_date", "trade_date"),
        {"comment": "技术指标数据表"},
    )


class StockPattern(Base):
    """K线形态识别表。"""

    __tablename__ = "stock_patterns"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, comment="交易日期")
    pattern_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="形态名称")
    pattern_type: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="形态类型 (bullish/bearish/neutral)"
    )
    signal: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="信号 (buy/sell/hold)"
    )
    confidence: Mapped[Optional[float]] = mapped_column(Float, comment="置信度 (0-1)")
    description: Mapped[Optional[str]] = mapped_column(Text, comment="形态描述")

    __table_args__ = (
        Index("idx_pattern_code_date", "code", "trade_date"),
        Index("idx_pattern_name", "pattern_name"),
        {"comment": "K线形态识别表"},
    )


class StockCyq(Base):
    """筹码分布数据表。"""

    __tablename__ = "stock_cyq"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, comment="交易日期")
    price: Mapped[float] = mapped_column(Float, nullable=False, comment="价格")
    percent: Mapped[float] = mapped_column(Float, nullable=False, comment="筹码占比(%)")
    avg_cost: Mapped[Optional[float]] = mapped_column(Float, comment="平均成本")
    concentration_90: Mapped[Optional[float]] = mapped_column(Float, comment="90%筹码集中度")
    concentration_70: Mapped[Optional[float]] = mapped_column(Float, comment="70%筹码集中度")
    winner_rate: Mapped[Optional[float]] = mapped_column(Float, comment="获利比例(%)")

    __table_args__ = (
        Index("idx_cyq_code_date", "code", "trade_date"),
        {"comment": "筹码分布数据表"},
    )


# ---------- Pydantic Schemas ----------

from pydantic import BaseModel


class StockBase(BaseModel):
    """股票基本信息 schema。"""
    code: str
    name: str
    market: str
    industry: str | None = None
    sector: str | None = None
    is_active: bool = True


class StockListItem(StockBase):
    """股票列表项 schema（含实时行情）。"""
    price: float | None = None
    pct_change: float | None = None
    volume: float | None = None
    amount: float | None = None
    turnover: float | None = None
    pe_ratio: float | None = None
    market_cap: float | None = None

    model_config = {"from_attributes": True}


class StockDetail(StockBase):
    """股票详情 schema。"""
    list_date: date | None = None
    total_share: float | None = None
    float_share: float | None = None
    price: float | None = None
    pct_change: float | None = None
    open: float | None = None
    high: float | None = None
    low: float | None = None
    pre_close: float | None = None
    volume: float | None = None
    amount: float | None = None
    turnover: float | None = None
    pe_ratio: float | None = None
    pb_ratio: float | None = None
    market_cap: float | None = None
    float_market_cap: float | None = None

    model_config = {"from_attributes": True}


class KlineData(BaseModel):
    """K线数据 schema。"""
    trade_date: date
    open: float
    high: float
    low: float
    close: float
    volume: float
    amount: float | None = None
    turnover: float | None = None
    pct_change: float | None = None


class IndicatorData(BaseModel):
    """技术指标 schema。"""
    trade_date: date
    ma5: float | None = None
    ma10: float | None = None
    ma20: float | None = None
    ma60: float | None = None
    ma120: float | None = None
    ma250: float | None = None
    macd_dif: float | None = None
    macd_dea: float | None = None
    macd_hist: float | None = None
    kdj_k: float | None = None
    kdj_d: float | None = None
    kdj_j: float | None = None
    rsi6: float | None = None
    rsi12: float | None = None
    rsi24: float | None = None
    boll_upper: float | None = None
    boll_mid: float | None = None
    boll_lower: float | None = None
    vol_ma5: float | None = None
    vol_ma10: float | None = None
    atr: float | None = None
    cci: float | None = None
    wr: float | None = None
    obv: float | None = None


class PatternData(BaseModel):
    """K线形态 schema。"""
    trade_date: date
    pattern_name: str
    pattern_type: str
    signal: str
    confidence: float | None = None
    description: str | None = None


class CyqData(BaseModel):
    """筹码分布 schema。"""
    trade_date: date
    price: float
    percent: float
    avg_cost: float | None = None
    concentration_90: float | None = None
    concentration_70: float | None = None
    winner_rate: float | None = None


class MarketOverview(BaseModel):
    """市场概览 schema。"""
    total_stocks: int
    up_count: int
    down_count: int
    flat_count: int
    total_amount: float
    avg_pct_change: float
    top_gainers: list[StockListItem]
    top_losers: list[StockListItem]
    top_volume: list[StockListItem]
    market_indices: list[dict]
