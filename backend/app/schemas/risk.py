from pydantic import BaseModel
from typing import Optional, Any

class RiskRuleCreate(BaseModel):
    rule_type: str
    params: dict[str, Any] = {}

class RiskAlertResponse(BaseModel):
    id: str
    level: str
    rule: str
    message: str
    value: float
    threshold: float
