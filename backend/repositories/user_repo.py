from .base import BaseRepository
from ..app.models.user import User

class UserRepository(BaseRepository[User]):
    async def get_by_username(self, username: str) -> User | None:
        for u in self._store.values():
            if u.username == username:
                return u
        return None
