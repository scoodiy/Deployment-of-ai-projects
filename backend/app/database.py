"""SQLAlchemy 数据库连接管理。"""

from collections.abc import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None


def get_engine() -> Engine:
    """延迟创建数据库引擎（避免 import 时因数据库不可用而崩溃）。"""
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_engine(
            settings.resolved_database_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
        )
    return _engine


def _get_session_local() -> sessionmaker:
    """延迟创建 sessionmaker。"""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=get_engine()
        )
    return _SessionLocal


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类。"""
    pass


def get_db() -> Generator[Session, None, None]:
    """获取数据库会话的依赖注入函数。"""
    db = _get_session_local()()
    try:
        yield db
    finally:
        db.close()
