from pydantic import BaseModel
from typing import Any

class RiskRule(BaseModel):
    id: str
    user_id: str
    rule_type: str
    params: dict[str, Any] = {}
    is_active: bool = True
