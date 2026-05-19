from sqlalchemy import select
from ..core.security import get_password_hash
from . import base as db_base
from .tables import User


async def seed_admin_user():
    """Create default admin user if it doesn't exist."""
    if not db_base.async_session:
        return

    async with db_base.async_session() as session:
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing = result.scalar_one_or_none()
        if existing is None:
            admin = User(
                username="admin",
                email="admin@quantbot.local",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_admin=True,
            )
            session.add(admin)
            await session.commit()
            print("[seed] Created default admin user (admin/admin123)")
        else:
            print("[seed] Admin user already exists, skipping.")
