"""内存存储 - 当数据库不可用时使用。"""
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any


class InMemoryStore:
    """简单的内存存储，模拟数据库操作。"""

    def __init__(self):
        self.users: Dict[str, Dict] = {}
        self.trades: Dict[str, Dict] = {}
        self.strategies: Dict[str, Dict] = {}
        self.risk_rules: Dict[str, Dict] = {}
        self._initialized = False

    def initialize(self):
        """初始化默认 admin 用户。"""
        if self._initialized:
            return
        from ..core.security import get_password_hash
        admin_id = str(uuid.uuid4())
        self.users[admin_id] = {
            "id": admin_id,
            "username": "admin",
            "email": "admin@quantbot.com",
            "hashed_password": get_password_hash("admin123"),
            "is_active": True,
            "is_admin": True,
            "created_at": datetime.utcnow(),
        }
        self._initialized = True


# 全局单例
memory_store = InMemoryStore()


def get_memory_store() -> InMemoryStore:
    return memory_store
