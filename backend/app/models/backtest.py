"""回测相关数据模型。"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
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


class Backtest(Base):
    """回测记录表。"""

    __tablename__ = "backtests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="回测名称")
    strategy_id: Mapped[Optional[int]] = mapped_column(Integer, comment="关联策略ID")
    strategy_name: Mapped[Optional[str]] = mapped_column(String(100), comment="策略名称快照")
    start_date: Mapped[date] = mapped_column(Date, nullable=False, comment="回测开始日期")
    end_date: Mapped[date] = mapped_column(Date, nullable=False, comment="回测结束日期")
    initial_capital: Mapped[float] = mapped_column(Float, nullable=False, comment="初始资金")
    final_capital: Mapped[Optional[float]] = mapped_column(Float, comment="最终资金")
    total_return: Mapped[Optional[float]] = mapped_column(Float, comment="总收益率(%)")
    annual_return: Mapped[Optional[float]] = mapped_column(Float, comment="年化收益率(%)")
    max_drawdown: Mapped[Optional[float]] = mapped_column(Float, comment="最大回撤(%)")
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Float, comment="夏普比率")
    win_rate: Mapped[Optional[float]] = mapped_column(Float, comment="胜率(%)")
    total_trades: Mapped[int] = mapped_column(Integer, default=0, comment="总交易次数")
    parameters: Mapped[Optional[str]] = mapped_column(Text, comment="回测参数 (JSON)")
    status: Mapped[str] = mapped_column(
        String(20), default="pending", comment="状态 (pending/running/completed/failed)"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), comment="创建时间"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, comment="完成时间")

    __table_args__ = ({"comment": "回测记录表"},)


class BacktestTrade(Base):
    """回测交易记录表。"""

    __tablename__ = "backtest_trades"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    backtest_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="回测ID")
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    name: Mapped[Optional[str]] = mapped_column(String(50), comment="股票名称")
    direction: Mapped[str] = mapped_column(
        String(10), nullable=False, comment="方向 (open_long/close_long/open_short/close_short)"
    )
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, comment="交易日期")
    price: Mapped[float] = mapped_column(Float, nullable=False, comment="成交价格")
    volume: Mapped[int] = mapped_column(Integer, nullable=False, comment="成交数量")
    amount: Mapped[float] = mapped_column(Float, nullable=False, comment="成交金额")
    commission: Mapped[Optional[float]] = mapped_column(Float, comment="手续费")
    profit: Mapped[Optional[float]] = mapped_column(Float, comment="本次交易盈亏")
    profit_pct: Mapped[Optional[float]] = mapped_column(Float, comment="本次交易收益率(%)")
    reason: Mapped[Optional[str]] = mapped_column(Text, comment="交易原因")

    __table_args__ = (
        Index("idx_bt_backtest_id", "backtest_id"),
        Index("idx_bt_code", "code"),
        {"comment": "回测交易记录表"},
    )


# ---------- Pydantic Schemas ----------

from pydantic import BaseModel


class BacktestBase(BaseModel):
    """回测基本信息 schema。"""
    name: str
    strategy_id: int | None = None
    strategy_name: str | None = None
    start_date: date
    end_date: date
    initial_capital: float
    parameters: str | None = None


class BacktestInfo(BacktestBase):
    """回测详情 schema。"""
    id: int
    final_capital: float | None = None
    total_return: float | None = None
    annual_return: float | None = None
    max_drawdown: float | None = None
    sharpe_ratio: float | None = None
    win_rate: float | None = None
    total_trades: int = 0
    status: str = "pending"
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class BacktestTradeItem(BaseModel):
    """回测交易记录项 schema。"""
    id: int
    backtest_id: int
    code: str
    name: str | None = None
    direction: str
    trade_date: date
    price: float
    volume: int
    amount: float
    commission: float | None = None
    profit: float | None = None
    profit_pct: float | None = None
    reason: str | None = None

    model_config = {"from_attributes": True}


class BacktestDetail(BacktestInfo):
    """回测详情（含交易记录）。"""
    trades: list[BacktestTradeItem] = []


class BacktestListResponse(BaseModel):
    """回测列表响应。"""
    total: int
    items: list[BacktestInfo]
