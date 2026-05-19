import asyncio
import logging
from datetime import datetime

logger = logging.getLogger("risk_notifier")

class RiskNotifier:
    """Dispatches risk alerts via multiple channels."""
    
    def __init__(self):
        self._webhook_url: str | None = None
        self._batch: list[dict] = []
        self._batch_interval: float = 30.0
        self._running = False
        self._task: asyncio.Task | None = None
    
    def set_webhook(self, url: str):
        self._webhook_url = url
    
    async def send_alert(self, alert: dict):
        self._batch.append(alert)
        logger.warning(f"Risk Alert [{alert['level']}]: {alert['message']}")
    
    async def _flush_batch(self):
        if not self._batch:
            return
        alerts = self._batch.copy()
        self._batch.clear()
        if self._webhook_url:
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    await client.post(self._webhook_url, json={"alerts": alerts}, timeout=10)
            except Exception as e:
                logger.error(f"Webhook delivery failed: {e}")
    
    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._loop())
    
    async def stop(self):
        self._running = False
        await self._flush_batch()
        if self._task:
            self._task.cancel()
    
    async def _loop(self):
        while self._running:
            await asyncio.sleep(self._batch_interval)
            await self._flush_batch()
