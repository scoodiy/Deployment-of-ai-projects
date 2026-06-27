"""关注列表 API。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.watchlist import WatchlistAddRequest, WatchlistItem, WatchlistResponse
from app.services import watchlist_service

router = APIRouter(prefix="/api/watchlist", tags=["关注列表"])


@router.get(
    "",
    response_model=WatchlistResponse,
    summary="关注列表",
    description="获取关注列表，包含实时行情数据。",
)
def get_watchlist(db: Session = Depends(get_db)) -> WatchlistResponse:
    """返回关注列表。"""
    return watchlist_service.get_watchlist(db)


@router.post(
    "",
    response_model=WatchlistItem,
    summary="添加关注",
    description="将股票添加到关注列表，已存在则更新备注和分组。",
)
def add_watchlist(
    req: WatchlistAddRequest,
    db: Session = Depends(get_db),
) -> WatchlistItem:
    """添加股票到关注列表。"""
    return watchlist_service.add_to_watchlist(db, req)


@router.delete(
    "/{code}",
    summary="取消关注",
    description="从关注列表中移除指定股票。",
)
def remove_watchlist(code: str, db: Session = Depends(get_db)) -> dict:
    """从关注列表移除股票。"""
    success = watchlist_service.remove_from_watchlist(db, code)
    if not success:
        raise HTTPException(status_code=404, detail=f"股票 {code} 不在关注列表中")
    return {"message": f"已取消关注 {code}"}
