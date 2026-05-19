import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...schemas.trade import TradeCreate, TradeResponse, PositionResponse
from ...api.deps import get_db, get_current_active_user
from ...db.tables import User, Trade as TradeTable
from datetime import datetime

router = APIRouter(prefix="/trades", tags=["trades"])


@router.post("/orders", response_model=TradeResponse)
async def create_order(
    order: TradeCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    trade = TradeTable(
        user_id=current_user.id,
        symbol=order.symbol,
        side=order.side,
        type=order.type,
        quantity=order.quantity,
        price=order.price or 0.0,
        status="FILLED",
        strategy_id=order.strategy_id,
    )
    db.add(trade)
    await db.flush()
    await db.refresh(trade)

    return TradeResponse(
        id=trade.id,
        symbol=trade.symbol,
        side=trade.side,
        type=trade.type,
        quantity=trade.quantity,
        price=trade.price,
        status=trade.status,
        created_at=trade.created_at,
    )


@router.get("/orders", response_model=list[TradeResponse])
async def list_orders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TradeTable)
        .where(TradeTable.user_id == current_user.id)
        .order_by(TradeTable.created_at.desc())
    )
    trades = result.scalars().all()
    return [
        TradeResponse(
            id=t.id,
            symbol=t.symbol,
            side=t.side,
            type=t.type,
            quantity=t.quantity,
            price=t.price,
            status=t.status,
            created_at=t.created_at,
        )
        for t in trades
    ]


@router.get("/orders/{order_id}", response_model=TradeResponse)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TradeTable).where(
            TradeTable.id == order_id,
            TradeTable.user_id == current_user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Order not found")

    return TradeResponse(
        id=trade.id,
        symbol=trade.symbol,
        side=trade.side,
        type=trade.type,
        quantity=trade.quantity,
        price=trade.price,
        status=trade.status,
        created_at=trade.created_at,
    )


@router.delete("/orders/{order_id}")
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TradeTable).where(
            TradeTable.id == order_id,
            TradeTable.user_id == current_user.id,
        )
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Order not found")

    trade.status = "CANCELLED"
    db.add(trade)
    await db.flush()

    return {"message": "Order cancelled"}


@router.get("/positions", response_model=list[PositionResponse])
async def get_positions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TradeTable).where(
            TradeTable.user_id == current_user.id,
            TradeTable.status == "FILLED",
        )
    )
    trades = result.scalars().all()

    positions: dict = {}
    for t in trades:
        sym = t.symbol
        if sym not in positions:
            positions[sym] = {
                "symbol": sym,
                "side": t.side,
                "quantity": 0.0,
                "avg_price": 0.0,
                "unrealized_pnl": 0.0,
            }
        p = positions[sym]
        if t.side == "BUY":
            total_cost = p["avg_price"] * p["quantity"] + t.price * t.quantity
            p["quantity"] += t.quantity
            p["avg_price"] = total_cost / p["quantity"] if p["quantity"] > 0 else 0
        else:
            p["quantity"] -= t.quantity

    return [PositionResponse(**p) for p in positions.values() if p["quantity"] > 0]


@router.get("/portfolio")
async def get_portfolio(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TradeTable).where(
            TradeTable.user_id == current_user.id,
            TradeTable.status == "FILLED",
        )
    )
    trades = result.scalars().all()

    total_value = sum(t.price * t.quantity for t in trades)
    pnl = sum(
        t.price * t.quantity * (1 if t.side == "SELL" else -1)
        for t in trades
    )
    return {
        "total_value": total_value,
        "total_pnl": pnl,
        "trade_count": len(trades),
    }
