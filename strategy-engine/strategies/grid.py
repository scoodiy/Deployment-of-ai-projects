from typing import Any
from .base import BaseStrategy
from ..engine.signals import Signal

class GridStrategy(BaseStrategy):
    """Grid trading strategy: buy/sell at fixed price intervals."""
    
    def __init__(self, config: dict[str, Any] = None):
        super().__init__(config)
        self._name = "GridStrategy"
        self._description = "Places buy/sell orders at fixed price intervals within a range"
        self._params_schema = {
            "upper_price": "float - Upper bound of grid",
            "lower_price": "float - Lower bound of grid",
            "grid_count": "int - Number of grid levels",
            "investment_amount": "float - Total investment",
        }
        self._grid_levels: list[float] = []
        self._active_grids: dict[float, str] = {}  # price -> "BUY" or "SELL"
    
    async def initialize(self):
        upper = self.config.get("upper_price", 200.0)
        lower = self.config.get("lower_price", 100.0)
        count = self.config.get("grid_count", 10)
        step = (upper - lower) / count
        self._grid_levels = [round(lower + i * step, 2) for i in range(count + 1)]
        for level in self._grid_levels:
            self._active_grids[level] = "BUY"
    
    async def on_tick(self, data: dict[str, Any]) -> list[Signal]:
        signals = []
        price = data.get("price", 0)
        symbol = data.get("symbol", "")
        
        for level in self._grid_levels:
            if price <= level and self._active_grids.get(level) == "BUY":
                signals.append(Signal(symbol=symbol, side="BUY", strength=0.7, price=level))
                self._active_grids[level] = "SELL"
            elif price >= level and self._active_grids.get(level) == "SELL":
                signals.append(Signal(symbol=symbol, side="SELL", strength=0.7, price=level))
                self._active_grids[level] = "BUY"
        return signals
