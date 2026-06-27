"""选股策略相关数据模型。"""

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


class Strategy(Base):
    """选股策略定义表。"""

    __tablename__ = "strategies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="策略名称")
    description: Mapped[Optional[str]] = mapped_column(Text, comment="策略描述")
    strategy_type: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="策略类型 (turtle/low_atr/breakout/...)"
    )
    parameters: Mapped[Optional[str]] = mapped_column(Text, comment="策略参数 (JSON)")
    is_active: Mapped[bool] = mapped_column(default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间"
    )

    __table_args__ = ({"comment": "选股策略定义表"},)


class StrategyResult(Base):
    """策略选股结果表。"""

    __tablename__ = "strategy_results"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    strategy_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="策略ID")
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="股票代码")
    name: Mapped[Optional[str]] = mapped_column(String(50), comment="股票名称")
    trade_date: Mapped[date] = mapped_column(Date, nullable=False, comment="选股日期")
    score: Mapped[Optional[float]] = mapped_column(Float, comment="选股评分")
    reason: Mapped[Optional[str]] = mapped_column(Text, comment="入选原因")
    price: Mapped[Optional[float]] = mapped_column(Float, comment="入选时价格")
    pct_change: Mapped[Optional[float]] = mapped_column(Float, comment="入选时涨跌幅")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), comment="创建时间"
    )

    __table_args__ = (
        Index("idx_sr_strategy_date", "strategy_id", "trade_date"),
        Index("idx_sr_code", "code"),
        {"comment": "策略选股结果表"},
    )


# ---------- Pydantic Schemas ----------

from pydantic import BaseModel


class StrategyBase(BaseModel):
    """策略基本信息 schema。"""
    name: str
    description: str | None = None
    strategy_type: str
    parameters: str | None = None


class StrategyInfo(StrategyBase):
    """策略详情 schema。"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StrategyResultItem(BaseModel):
    """策略选股结果项 schema。"""
    id: int
    strategy_id: int
    code: str
    name: str | None = None
    trade_date: date
    score: float | None = None
    reason: str | None = None
    price: float | None = None
    pct_change: float | None = None

    model_config = {"from_attributes": True}


class StrategyListResponse(BaseModel):
    """策略列表响应。"""
    total: int
    items: list[StrategyInfo]


class StrategyResultResponse(BaseModel):
    """策略结果响应。"""
    strategy: StrategyInfo
    total: int
    items: list[StrategyResultItem]
