import random
from datetime import datetime

class MarketService:
    """Provides market data (mock)."""
    
    async def get_ticker(self, symbol: str) -> dict:
        base = random.uniform(10, 200)
        return {"symbol": symbol, "price": round(base, 2), "volume": round(random.uniform(1e6, 1e8), 0),
                "change_24h": round(random.uniform(-5, 5), 2), "timestamp": datetime.now().isoformat()}
    
    async def get_klines(self, symbol: str, interval: str = "1d", limit: int = 100) -> list[dict]:
        klines, base = [], random.uniform(50, 150)
        for i in range(limit):
            o = base + random.uniform(-3, 3)
            c = o + random.uniform(-2, 2)
            klines.append({"symbol": symbol, "open": round(o, 2), "high": round(max(o, c) + 1, 2),
                           "low": round(min(o, c) - 1, 2), "close": round(c, 2),
                           "volume": round(random.uniform(1e5, 1e7), 0), "interval": interval,
                           "timestamp": datetime.now().isoformat()})
            base = c
        return klines
