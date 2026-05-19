import httpx
from datetime import datetime
from typing import Any

class StockMarketCollector:
    """Collects stock market data via adapters."""
    
    def __init__(self, adapter=None):
        self.adapter = adapter
    
    async def get_ticker(self, symbol: str) -> dict:
        if self.adapter:
            raw = await self.adapter.fetch_realtime(symbol)
            return {
                "symbol": symbol, "price": float(raw.get("price", 0)),
                "volume": float(raw.get("volume", 0)),
                "change_24h": float(raw.get("change_pct", 0)),
                "timestamp": datetime.now().isoformat(),
            }
        return {"symbol": symbol, "price": 0, "volume": 0, "change_24h": 0, "timestamp": datetime.now().isoformat()}
    
    async def get_klines(self, symbol: str, timeframe: str = "1d", limit: int = 100) -> list[dict]:
        if self.adapter:
            return await self.adapter.fetch_kline(symbol, timeframe, limit)
        return []
