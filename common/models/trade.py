from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class TradeOrder(BaseModel):
    id: str
    symbol: str
    side: OrderSide
    type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = datetime.now()
    filled_at: Optional[datetime] = None
    strategy_id: Optional[str] = None

class Trade(BaseModel):
    id: str
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    fee: float = 0.0
    timestamp: datetime = datetime.now()

class Position(BaseModel):
    symbol: str
    side: OrderSide
    quantity: float
    avg_price: float
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0

class Portfolio(BaseModel):
    positions: list[Position] = []
    total_value: float = 0.0
    cash_balance: float = 0.0
    total_pnl: float = 0.0
