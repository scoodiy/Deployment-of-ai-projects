from fastapi import APIRouter, Depends, HTTPException
from ...schemas.trade import TradeCreate, TradeResponse, PositionResponse
from ...api.deps import get_db, get_current_active_user
from ...utils import generate_id
from datetime import datetime

router = APIRouter(prefix="/trades", tags=["trades"])

@router.post("/orders", response_model=TradeResponse)
async def create_order(order: TradeCreate, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    order_id = generate_id()
    trade = {
        "id": order_id,
        "user_id": user["user_id"],
        "symbol": order.symbol,
        "side": order.side,
        "type": order.type,
        "quantity": order.quantity,
        "price": order.price or 0.0,
        "status": "FILLED",
        "strategy_id": order.strategy_id,
        "created_at": datetime.now(),
    }
    db["trades"][order_id] = trade
    return TradeResponse(**trade)

@router.get("/orders", response_model=list[TradeResponse])
async def list_orders(user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    return [TradeResponse(**t) for t in db["trades"].values() if t.get("user_id") == user["user_id"]]

@router.get("/orders/{order_id}", response_model=TradeResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    trade = db["trades"].get(order_id)
    if not trade or trade.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    return TradeResponse(**trade)

@router.delete("/orders/{order_id}")
async def cancel_order(order_id: str, user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    trade = db["trades"].get(order_id)
    if not trade or trade.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    trade["status"] = "CANCELLED"
    return {"message": "Order cancelled"}

@router.get("/positions", response_model=list[PositionResponse])
async def get_positions(user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    positions = {}
    for t in db["trades"].values():
        if t.get("user_id") != user["user_id"] or t["status"] != "FILLED":
            continue
        sym = t["symbol"]
        if sym not in positions:
            positions[sym] = {"symbol": sym, "side": t["side"], "quantity": 0.0, "avg_price": 0.0, "unrealized_pnl": 0.0}
        p = positions[sym]
        if t["side"] == "BUY":
            total_cost = p["avg_price"] * p["quantity"] + t["price"] * t["quantity"]
            p["quantity"] += t["quantity"]
            p["avg_price"] = total_cost / p["quantity"] if p["quantity"] > 0 else 0
        else:
            p["quantity"] -= t["quantity"]
    return [PositionResponse(**p) for p in positions.values() if p["quantity"] > 0]

@router.get("/portfolio")
async def get_portfolio(user: dict = Depends(get_current_active_user), db: dict = Depends(get_db)):
    trades = [t for t in db["trades"].values() if t.get("user_id") == user["user_id"] and t["status"] == "FILLED"]
    total_value = sum(t["price"] * t["quantity"] for t in trades)
    pnl = sum(t["price"] * t["quantity"] * (1 if t["side"] == "SELL" else -1) for t in trades)
    return {"total_value": total_value, "total_pnl": pnl, "trade_count": len(trades)}
