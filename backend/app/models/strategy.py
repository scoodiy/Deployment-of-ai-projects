from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any

class StrategyConfig(BaseModel):
    id: str
    user_id: str
    name: str
    type: str
    params: dict[str, Any] = {}
    is_active: bool = False
    created_at: datetime = datetime.now()
