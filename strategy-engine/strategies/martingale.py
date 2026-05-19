from typing import Any
from .base import BaseStrategy
from ..engine.signals import Signal

class MartingaleStrategy(BaseStrategy):
    """Martingale strategy: double position after each loss."""
    
    def __init__(self, config: dict[str, Any] = None):
        super().__init__(config)
        self._name = "MartingaleStrategy"
        self._description = "Doubles position size after each losing trade"
        self._params_schema = {
            "base_amount": "float - Base trade amount",
            "max_multiplier": "int - Maximum position multiplier",
            "max_losses": "int - Max consecutive losses before stopping",
        }
        self._consecutive_losses = 0
        self._current_multiplier = 1
        self._last_price = 0.0
    
    async def initialize(self):
        self._consecutive_losses = 0
        self._current_multiplier = 1
    
    async def on_tick(self, data: dict[str, Any]) -> list[Signal]:
        price = data.get("price", 0)
        symbol = data.get("symbol", "")
        max_losses = self.config.get("max_losses", 5)
        max_multiplier = self.config.get("max_multiplier", 8)
        
        if self._consecutive_losses >= max_losses:
            return []
        
        self._current_multiplier = min(2 ** self._consecutive_losses, max_multiplier)
        strength = min(0.5 + self._consecutive_losses * 0.1, 0.9)
        
        if self._last_price > 0 and price < self._last_price:
            self._consecutive_losses += 1
        elif self._last_price > 0 and price > self._last_price:
            self._consecutive_losses = max(0, self._consecutive_losses - 1)
            self._current_multiplier = max(1, self._current_multiplier // 2)
        
        self._last_price = price
        return [Signal(symbol=symbol, side="BUY", strength=strength, price=price,
                       metadata={"multiplier": self._current_multiplier})]
    
    async def on_order_filled(self, order: dict[str, Any]):
        if order.get("side") == "SELL" and order.get("pnl", 0) < 0:
            self._consecutive_losses += 1
        elif order.get("side") == "SELL" and order.get("pnl", 0) > 0:
            self._consecutive_losses = 0
            self._current_multiplier = 1
