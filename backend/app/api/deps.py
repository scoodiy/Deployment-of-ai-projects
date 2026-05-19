from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_session
from ..db.tables import User
from ..core.security import get_current_user


async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    """Return the database session dependency."""
    return session


async def get_current_active_user(
    user_payload: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Fetch the current user from the database and verify active status."""
    user_id = user_payload.get("user_id") or user_payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    return user
