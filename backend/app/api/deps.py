from fastapi import Depends, HTTPException
from ..core.security import get_current_user

# In-memory stores (replace with DB in production)
_users_db: dict = {}
_trades_db: dict = {}
_strategies_db: dict = {}
_risk_rules_db: dict = {}

async def get_db():
    """Get database session (in-memory stub)."""
    return {
        "users": _users_db,
        "trades": _trades_db,
        "strategies": _strategies_db,
        "risk_rules": _risk_rules_db,
    }

async def get_current_active_user(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("user_id"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
