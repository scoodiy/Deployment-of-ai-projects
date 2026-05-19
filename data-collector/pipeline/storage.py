from typing import Any
from datetime import datetime

class DataStorage:
    """Stores market data (in-memory, replace with DB in production)."""
    
    def __init__(self):
        self._klines: dict[str, list[dict]] = {}
        self._tickers: dict[str, dict] = {}
    
    async def save_klines(self, klines: list[dict]):
        for k in klines:
            key = f"{k['symbol']}_{k.get('interval', '1d')}"
            if key not in self._klines:
                self._klines[key] = []
            self._klines[key].append(k)
            if len(self._klines[key]) > 1000:
                self._klines[key] = self._klines[key][-1000:]
    
    async def get_klines(self, symbol: str, timeframe: str = "1d", start: str = None, end: str = None) -> list[dict]:
        key = f"{symbol}_{timeframe}"
        return self._klines.get(key, [])
    
    async def save_ticker(self, ticker: dict):
        self._tickers[ticker["symbol"]] = ticker
    
    async def get_ticker(self, symbol: str) -> dict | None:
        return self._tickers.get(symbol)
