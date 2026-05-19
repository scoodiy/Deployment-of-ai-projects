from pydantic import BaseModel
from typing import Optional, Any

class StrategyCreate(BaseModel):
    name: str
    type: str
    params: dict[str, Any] = {}

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    params: Optional[dict[str, Any]] = None

class StrategyResponse(BaseModel):
    id: str
    name: str
    type: str
    params: dict[str, Any]
    is_active: bool
