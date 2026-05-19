from fastapi import Depends, HTTPException
from ..core.security import get_current_user
from ..db.base import is_database_available, get_session
from ..db.memory import get_memory_store, InMemoryStore
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Union


async def get_db():
    """获取数据库会话或内存存储。"""
    if is_database_available():
        async for session in get_session():
            yield session
    else:
        store = get_memory_store()
        store.initialize()
        yield store


async def get_current_active_user(user: dict = Depends(get_current_user)) -> dict:
    if not user.get("user_id"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
