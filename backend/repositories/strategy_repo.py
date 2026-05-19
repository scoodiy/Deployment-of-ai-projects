from .base import BaseRepository
from ..app.models.strategy import StrategyConfig

class StrategyRepository(BaseRepository[StrategyConfig]):
    async def get_by_user(self, user_id: str) -> list[StrategyConfig]:
        return [s for s in self._store.values() if s.user_id == user_id]
