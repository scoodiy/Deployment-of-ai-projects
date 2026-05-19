import asyncio
from typing import Any

class CollectorScheduler:
    """Schedules periodic data collection."""
    
    def __init__(self):
        self._jobs: dict[str, dict] = {}
        self._running = False
        self._task: asyncio.Task | None = None
    
    def schedule_stock_collection(self, symbols: list[str], interval_minutes: int = 5):
        import uuid
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = {"type": "stock", "symbols": symbols, "interval": interval_minutes * 60, "active": True}
        return job_id
    
    def schedule_crypto_collection(self, symbols: list[str], interval_minutes: int = 1):
        import uuid
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = {"type": "crypto", "symbols": symbols, "interval": interval_minutes * 60, "active": True}
        return job_id
    
    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._loop())
    
    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
    
    async def _loop(self):
        while self._running:
            await asyncio.sleep(10)
