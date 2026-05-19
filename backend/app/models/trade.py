from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


def _default_now() -> datetime:
    return datetime.now()


class TradeRecord(BaseModel):
    id: str
    user_id: str
    symbol: str
    side: str
    type: str
    quantity: float
    price: float
    status: str = "PENDING"
    strategy_id: Optional[str] = None
    created_at: datetime = Field(default_factory=_default_now)
