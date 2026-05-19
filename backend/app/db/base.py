from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import logging

logger = logging.getLogger(__name__)

# 全局状态：是否使用数据库
_use_database = False
engine = None
async_session = None


class Base(DeclarativeBase):
    pass


async def init_db():
    """初始化数据库连接。如果连接失败，降级为内存存储。"""
    global _use_database, engine, async_session

    from ..core.config import get_settings
    settings = get_settings()

    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL 未设置，使用内存存储模式")
        _use_database = False
        return

    try:
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        async_session = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        # 测试连接
        async with engine.begin() as conn:
            from .tables import Base as TableBase
            await conn.run_sync(TableBase.metadata.create_all)

        _use_database = True
        logger.info("✅ 数据库连接成功")
    except Exception as e:
        logger.warning(f"⚠️ 数据库连接失败: {e}，降级为内存存储")
        _use_database = False
        engine = None
        async_session = None


async def close_db():
    """关闭数据库连接。"""
    global engine
    if engine:
        await engine.dispose()


def is_database_available() -> bool:
    """检查数据库是否可用。"""
    return _use_database


async def get_session() -> AsyncGenerator[Optional[AsyncSession], None]:
    """获取数据库会话。如果数据库不可用，返回 None。"""
    if not _use_database or async_session is None:
        yield None
        return

    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
