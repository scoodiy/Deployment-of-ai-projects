"""关注列表相关数据模型。"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Watchlist(Base):
    """关注列表表。"""

    __tablename__ = "watchlist"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, comment="股票代码")
    name: Mapped[Optional[str]] = mapped_column(String(50), comment="股票名称")
    remark: Mapped[Optional[str]] = mapped_column(Text, comment="备注")
    group_name: Mapped[Optional[str]] = mapped_column(String(50), comment="分组名称")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), comment="添加时间"
    )

    __table_args__ = (
        Index("idx_watchlist_code", "code"),
        {"comment": "关注列表表"},
    )


# ---------- Pydantic Schemas ----------

from pydantic import BaseModel


class WatchlistItem(BaseModel):
    """关注列表项 schema。"""
    id: int
    code: str
    name: str | None = None
    remark: str | None = None
    group_name: str | None = None
    created_at: datetime
    # 实时行情（查询时填充）
    price: float | None = None
    pct_change: float | None = None
    volume: float | None = None
    amount: float | None = None

    model_config = {"from_attributes": True}


class WatchlistAddRequest(BaseModel):
    """添加关注请求 schema。"""
    code: str
    name: str | None = None
    remark: str | None = None
    group_name: str | None = None


class WatchlistResponse(BaseModel):
    """关注列表响应。"""
    total: int
    items: list[WatchlistItem]
