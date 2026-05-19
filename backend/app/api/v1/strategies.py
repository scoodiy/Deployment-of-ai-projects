import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ...schemas.strategy import StrategyCreate, StrategyUpdate, StrategyResponse
from ...api.deps import get_db, get_current_active_user
from ...db.tables import User, Strategy as StrategyTable

router = APIRouter(prefix="/strategies", tags=["strategies"])


def _strategy_to_response(s: StrategyTable) -> StrategyResponse:
    params = {}
    if s.params:
        try:
            params = json.loads(s.params)
        except (json.JSONDecodeError, TypeError):
            params = {}
    return StrategyResponse(
        id=s.id,
        name=s.name,
        type=s.type,
        params=params,
        is_active=s.is_active,
    )


@router.post("/", response_model=StrategyResponse)
async def create_strategy(
    strategy: StrategyCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    record = StrategyTable(
        user_id=current_user.id,
        name=strategy.name,
        type=strategy.type,
        params=json.dumps(strategy.params) if strategy.params else None,
        is_active=False,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return _strategy_to_response(record)


@router.get("/", response_model=list[StrategyResponse])
async def list_strategies(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategyTable)
        .where(StrategyTable.user_id == current_user.id)
        .order_by(StrategyTable.created_at.desc())
    )
    return [_strategy_to_response(s) for s in result.scalars().all()]


@router.get("/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategyTable).where(
            StrategyTable.id == strategy_id,
            StrategyTable.user_id == current_user.id,
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return _strategy_to_response(s)


@router.put("/{strategy_id}", response_model=StrategyResponse)
async def update_strategy(
    strategy_id: str,
    update: StrategyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategyTable).where(
            StrategyTable.id == strategy_id,
            StrategyTable.user_id == current_user.id,
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")

    if update.name is not None:
        s.name = update.name
    if update.params is not None:
        s.params = json.dumps(update.params)

    db.add(s)
    await db.flush()
    await db.refresh(s)
    return _strategy_to_response(s)


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategyTable).where(
            StrategyTable.id == strategy_id,
            StrategyTable.user_id == current_user.id,
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")

    await db.delete(s)
    await db.flush()
    return {"message": "Strategy deleted"}


@router.post("/{strategy_id}/activate", response_model=StrategyResponse)
async def activate_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategyTable).where(
            StrategyTable.id == strategy_id,
            StrategyTable.user_id == current_user.id,
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")

    s.is_active = True
    db.add(s)
    await db.flush()
    await db.refresh(s)
    return _strategy_to_response(s)


@router.post("/{strategy_id}/deactivate", response_model=StrategyResponse)
async def deactivate_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategyTable).where(
            StrategyTable.id == strategy_id,
            StrategyTable.user_id == current_user.id,
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")

    s.is_active = False
    db.add(s)
    await db.flush()
    await db.refresh(s)
    return _strategy_to_response(s)
