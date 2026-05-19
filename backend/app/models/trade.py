from datetime import datetime
from pydantic import BaseModel
from typing import Optional

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
    created_at: datetime = datetime.now()
