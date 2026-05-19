from .base import BaseRepository
from ..app.models.trade import TradeRecord

class TradeRepository(BaseRepository[TradeRecord]):
    async def get_by_user(self, user_id: str) -> list[TradeRecord]:
        return [t for t in self._store.values() if t.user_id == user_id]
