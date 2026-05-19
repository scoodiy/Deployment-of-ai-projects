import json
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...schemas.risk import RiskRuleCreate, RiskAlertResponse
from ...api.deps import get_db, get_current_active_user
from ...db.tables import User, RiskRule as RiskRuleTable
from ...utils import generate_id

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/metrics")
async def get_risk_metrics(current_user: User = Depends(get_current_active_user)):
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
async def get_risk_alerts(current_user: User = Depends(get_current_active_user)):
    # TODO: Replace with real alert generation from risk rules
    levels = ["INFO", "WARNING", "CRITICAL"]
    rules = ["position_limit", "daily_loss", "circuit_breaker"]
    return [
        RiskAlertResponse(
            id=generate_id(),
            level=random.choice(levels),
            rule=random.choice(rules),
            message="Sample alert",
            value=round(random.uniform(1, 100), 2),
            threshold=round(random.uniform(50, 200), 2),
        )
        for _ in range(5)
    ]


@router.post("/rules")
async def create_risk_rule(
    rule: RiskRuleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    record = RiskRuleTable(
        user_id=current_user.id,
        rule_type=rule.rule_type,
        params=json.dumps(rule.params) if rule.params else None,
        is_active=True,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    return {
        "id": record.id,
        "user_id": record.user_id,
        "rule_type": record.rule_type,
        "params": json.loads(record.params) if record.params else {},
        "is_active": record.is_active,
    }


@router.get("/rules")
async def list_risk_rules(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RiskRuleTable)
        .where(RiskRuleTable.user_id == current_user.id)
        .order_by(RiskRuleTable.created_at.desc())
    )
    rules = result.scalars().all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "rule_type": r.rule_type,
            "params": json.loads(r.params) if r.params else {},
            "is_active": r.is_active,
        }
        for r in rules
    ]


@router.put("/rules/{rule_id}")
async def update_risk_rule(
    rule_id: str,
    update: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RiskRuleTable).where(
            RiskRuleTable.id == rule_id,
            RiskRuleTable.user_id == current_user.id,
        )
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")

    if "params" in update:
        r.params = json.dumps(update["params"])
    if "rule_type" in update:
        r.rule_type = update["rule_type"]
    if "is_active" in update:
        r.is_active = update["is_active"]

    db.add(r)
    await db.flush()
    await db.refresh(r)

    return {
        "id": r.id,
        "user_id": r.user_id,
        "rule_type": r.rule_type,
        "params": json.loads(r.params) if r.params else {},
        "is_active": r.is_active,
    }
