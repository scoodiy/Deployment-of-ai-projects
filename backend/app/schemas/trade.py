from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TradeCreate(BaseModel):
    symbol: str
    side: str
    type: str
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    strategy_id: Optional[str] = None

class TradeResponse(BaseModel):
    id: str
    symbol: str
    side: str
    type: str
    quantity: float
    price: float
    status: str
    created_at: datetime

class PositionResponse(BaseModel):
    symbol: str
    side: str
    quantity: float
    avg_price: float
    unrealized_pnl: float
