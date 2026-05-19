from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Any


def _default_now() -> datetime:
    return datetime.now()


class StrategyConfig(BaseModel):
    id: str
    user_id: str
    name: str
    type: str
    params: dict[str, Any] = {}
    is_active: bool = False
    created_at: datetime = Field(default_factory=_default_now)
