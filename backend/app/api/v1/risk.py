from fastapi import APIRouter, Depends, HTTPException
from ...schemas.risk import RiskRuleCreate, RiskAlertResponse
from ...api.deps import get_db, get_current_active_user
from ...utils import generate_id
from datetime import datetime
import random

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/metrics")
async def get_risk_metrics(user: dict = Depends(get_current_active_user)):
    # TODO: Replace with real risk metric calculations from trade history
    return {
        "max_drawdown": round(random.uniform(5, 25), 2),
        "sharpe_ratio": round(random.uniform(0.5, 3.0), 2),
        "win_rate": round(random.uniform(40, 70), 1),
        "profit_factor": round(random.uniform(1.0, 2.5), 2),
        "var_95": round(random.uniform(1, 10), 2),
        "total_trades": random.randint(50, 500),
        "consecutive_losses": random.randint(0, 5),
    }


@router.get("/alerts", response_model=list[RiskAlertResponse])
async def get_risk_alerts(user: dict = Depends(get_current_active_user)):
    # TODO: Replace with real alert generation from risk rules
    levels = ["INFO", "WARNING", "CRITICAL"]
    rules = ["position_limit", "daily_loss", "circuit_breaker"]
    return [
        RiskAlertResponse(id=generate_id(), level=random.choice(levels), rule=random.choice(rules),
                          message="Sample alert", value=round(random.uniform(1, 100), 2),
                          threshold=round(random.uniform(50, 200), 2))
        for _ in range(5)
    ]


@router.post("/rules")
async def create_risk_rule(rule: RiskRuleCreate, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    rid = generate_id()
    record = {"id": rid, "user_id": user["user_id"], "rule_type": rule.rule_type, "params": rule.params, "is_active": True}
    db["risk_rules"][rid] = record
    return record


@router.get("/rules")
async def list_risk_rules(user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    return [r for r in db["risk_rules"].values() if r.get("user_id") == user["user_id"]]


@router.put("/rules/{rule_id}")
async def update_risk_rule(rule_id: str, update: dict, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    r = db["risk_rules"].get(rule_id)
    if not r or r.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Rule not found")
    r.update(update)
    return r
