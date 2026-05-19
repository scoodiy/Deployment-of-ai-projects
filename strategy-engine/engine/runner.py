import asyncio
from datetime import datetime
from typing import Any
from .signals import Signal

class StrategyRunner:
    """Runs a strategy against market data."""
    
    def __init__(self, strategy, symbols: list[str], config: dict[str, Any] = None):
        self.strategy = strategy
        self.symbols = symbols
        self.config = config or {}
        self._running = False
        self._task: asyncio.Task | None = None
        self._last_signal: Signal | None = None
        self._pnl: float = 0.0
        self._trade_count: int = 0
    
    async def run(self):
        """Main loop: fetch data -> compute signals -> log."""
        self._running = True
        await self.strategy.initialize()
        while self._running:
            try:
                for symbol in self.symbols:
                    data = {"symbol": symbol, "price": 100.0, "volume": 1000.0, "timestamp": datetime.now()}
                    signals = await self.strategy.on_tick(data)
                    if signals:
                        for sig in signals:
                            self._last_signal = sig
                            self._trade_count += 1
                await asyncio.sleep(self.config.get("interval_seconds", 60))
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Strategy error: {e}")
                await asyncio.sleep(5)
    
    async def start(self):
        """Start the strategy in background."""
        self._task = asyncio.create_task(self.run())
    
    async def stop(self):
        """Stop the strategy."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
    
    async def get_status(self) -> dict:
        return {
            "strategy": self.strategy.name,
            "running": self._running,
            "symbols": self.symbols,
            "last_signal": {
                "symbol": self._last_signal.symbol,
                "side": self._last_signal.side,
                "strength": self._last_signal.strength,
            } if self._last_signal else None,
            "trade_count": self._trade_count,
            "pnl": self._pnl,
        }
