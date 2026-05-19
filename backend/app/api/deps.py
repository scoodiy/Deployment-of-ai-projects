from fastapi import Depends, HTTPException
from ..core.security import get_current_user
from ..db.base import is_database_available, get_session
from ..db.memory import get_memory_store, InMemoryStore
from ..db.tables import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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


async def get_current_active_user(user: dict = Depends(get_current_user), db=None) -> User:
    """从数据库查询实际的 User 对象。"""
    if not user.get("user_id"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = user["user_id"]
    
    # 尝试从数据库查询
    if is_database_available():
        async for session in get_session():
            result = await session.execute(select(User).where(User.id == user_id))
            db_user = result.scalar_one_or_none()
            if db_user:
                return db_user
    
    # 降级：返回一个简单的对象
    class SimpleUser:
        def __init__(self, uid, username):
            self.id = uid
            self.username = username
            self.email = f"{username}@example.com"
            self.is_active = True
            self.is_admin = username == "admin"
    
    return SimpleUser(user_id, user.get("username", ""))
