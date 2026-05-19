import asyncio
from datetime import datetime
from typing import Any, Callable
from .loader import StrategyLoader

class StrategyScheduler:
    """Schedules strategy execution."""
    
    def __init__(self):
        self._jobs: dict[str, dict] = {}
        self._loader = StrategyLoader()
        self._running = False
        self._task: asyncio.Task | None = None
    
    def schedule(self, strategy_name: str, symbols: list[str], interval_seconds: int = 3600, config: dict[str, Any] = None) -> str:
        """Schedule a strategy to run at intervals."""
        import uuid
        job_id = str(uuid.uuid4())
        self._jobs[job_id] = {
            "id": job_id,
            "strategy_name": strategy_name,
            "symbols": symbols,
            "interval_seconds": interval_seconds,
            "config": config or {},
            "last_run": None,
            "next_run": datetime.now(),
            "active": True,
        }
        return job_id
    
    def unschedule(self, job_id: str) -> bool:
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False
    
    def list_jobs(self) -> list[dict]:
        return list(self._jobs.values())
    
    async def start(self):
        """Start the scheduler loop."""
        self._running = True
        self._task = asyncio.create_task(self._loop())
    
    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
    
    async def _loop(self):
        while self._running:
            now = datetime.now()
            for job in self._jobs.values():
                if job["active"] and now >= job["next_run"]:
                    job["last_run"] = now
                    job["next_run"] = datetime.fromtimestamp(now.timestamp() + job["interval_seconds"])
            await asyncio.sleep(10)
