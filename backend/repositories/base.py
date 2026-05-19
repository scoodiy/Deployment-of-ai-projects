from typing import TypeVar, Generic, Optional
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class BaseRepository(Generic[T]):
    """Generic in-memory repository."""
    
    def __init__(self):
        self._store: dict[str, T] = {}
    
    async def create(self, item: T) -> T:
        key = getattr(item, "id", str(len(self._store)))
        self._store[key] = item
        return item
    
    async def get(self, id: str) -> Optional[T]:
        return self._store.get(id)
    
    async def list_all(self) -> list[T]:
        return list(self._store.values())
    
    async def update(self, id: str, data: dict) -> Optional[T]:
        item = self._store.get(id)
        if item:
            for k, v in data.items():
                setattr(item, k, v)
        return item
    
    async def delete(self, id: str) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
