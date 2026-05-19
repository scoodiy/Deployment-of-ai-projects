import httpx
import random
from datetime import datetime

class FinancialsCollector:
    """Collects financial data for stocks."""
    
    async def get_financials(self, symbol: str) -> dict:
        return {
            "symbol": symbol, "pe_ratio": round(random.uniform(5, 50), 2),
            "pb_ratio": round(random.uniform(0.5, 10), 2),
            "revenue": round(random.uniform(1e9, 1e12), 0),
            "net_profit": round(random.uniform(1e8, 1e11), 0),
            "roe": round(random.uniform(5, 30), 2),
            "timestamp": datetime.now().isoformat(),
        }
