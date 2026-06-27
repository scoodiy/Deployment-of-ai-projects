"""关注列表业务逻辑。"""

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.stock import StockRealtime
from app.models.watchlist import (
    Watchlist,
    WatchlistAddRequest,
    WatchlistItem,
    WatchlistResponse,
)


def get_watchlist(db: Session) -> WatchlistResponse:
    """获取关注列表（含实时行情）。"""
    rows = (
        db.query(Watchlist, StockRealtime)
        .outerjoin(StockRealtime, Watchlist.code == StockRealtime.code)
        .order_by(desc(Watchlist.created_at))
        .all()
    )

    items = [
        WatchlistItem(
            id=r.Watchlist.id,
            code=r.Watchlist.code,
            name=r.Watchlist.name or (r.StockRealtime.name if r.StockRealtime else None),
            remark=r.Watchlist.remark,
            group_name=r.Watchlist.group_name,
            created_at=r.Watchlist.created_at,
            price=r.StockRealtime.price if r.StockRealtime else None,
            pct_change=r.StockRealtime.pct_change if r.StockRealtime else None,
            volume=r.StockRealtime.volume if r.StockRealtime else None,
            amount=r.StockRealtime.amount if r.StockRealtime else None,
        )
        for r in rows
    ]

    return WatchlistResponse(total=len(items), items=items)


def add_to_watchlist(db: Session, req: WatchlistAddRequest) -> WatchlistItem:
    """添加股票到关注列表。"""
    existing = db.query(Watchlist).filter(Watchlist.code == req.code).first()
    if existing:
        if req.name:
            existing.name = req.name
        if req.remark is not None:
            existing.remark = req.remark
        if req.group_name is not None:
            existing.group_name = req.group_name
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = Watchlist(
            code=req.code,
            name=req.name,
            remark=req.remark,
            group_name=req.group_name,
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    # 获取实时行情
    rt = db.query(StockRealtime).filter(StockRealtime.code == item.code).first()
    return WatchlistItem(
        id=item.id,
        code=item.code,
        name=item.name,
        remark=item.remark,
        group_name=item.group_name,
        created_at=item.created_at,
        price=rt.price if rt else None,
        pct_change=rt.pct_change if rt else None,
        volume=rt.volume if rt else None,
        amount=rt.amount if rt else None,
    )


def remove_from_watchlist(db: Session, code: str) -> bool:
    """从关注列表删除股票。"""
    item = db.query(Watchlist).filter(Watchlist.code == code).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
