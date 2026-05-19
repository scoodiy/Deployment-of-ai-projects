from fastapi import APIRouter, Depends, HTTPException
from ...schemas.strategy import StrategyCreate, StrategyUpdate, StrategyResponse
from ...api.deps import get_db, get_current_active_user
from ...utils import generate_id

router = APIRouter(prefix="/strategies", tags=["strategies"])

@router.post("/", response_model=StrategyResponse)
async def create_strategy(strategy: StrategyCreate, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    sid = generate_id()
    record = {"id": sid, "user_id": user["user_id"], "name": strategy.name, "type": strategy.type, "params": strategy.params, "is_active": False}
    db["strategies"][sid] = record
    return StrategyResponse(**record)

@router.get("/", response_model=list[StrategyResponse])
async def list_strategies(user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    return [StrategyResponse(**s) for s in db["strategies"].values() if s.get("user_id") == user["user_id"]]

@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(strategy_id: str, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    s = db["strategies"].get(strategy_id)
    if not s or s.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return StrategyResponse(**s)

@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(strategy_id: str, update: StrategyUpdate, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    s = db["strategies"].get(strategy_id)
    if not s or s.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    if update.name is not None:
        s["name"] = update.name
    if update.params is not None:
        s["params"] = update.params
    return StrategyResponse(**s)

@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: str, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    s = db["strategies"].get(strategy_id)
    if not s or s.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    del db["strategies"][strategy_id]
    return {"message": "Strategy deleted"}

@router.post("/{strategy_id}/activate", response_model=StrategyResponse)
async def activate_strategy(strategy_id: str, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    s = db["strategies"].get(strategy_id)
    if not s or s.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    s["is_active"] = True
    return StrategyResponse(**s)

@router.post("/{strategy_id}/deactivate", response_model=StrategyResponse)
async def deactivate_strategy(strategy_id: str, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    s = db["strategies"].get(strategy_id)
    if not s or s.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Strategy not found")
    s["is_active"] = False
    return StrategyResponse(**s)
