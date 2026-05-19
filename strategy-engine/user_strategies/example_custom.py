"""Example custom strategy - demonstrates how users can create their own strategies."""
from strategies.base import BaseStrategy
from engine.signals import Signal
from typing import Any

class ExampleCustomStrategy(BaseStrategy):
    """Example: Buy when price drops 5% from recent high, sell when up 5% from recent low."""
    
    def __init__(self, config: dict[str, Any] = None):
        super().__init__(config)
        self._name = "ExampleCustomStrategy"
        self._description = "Buy on 5% dip, sell on 5% gain"
        self._recent_high = 0.0
        self._recent_low = float("inf")
        self._entry_price = 0.0
    
    async def initialize(self):
        self._recent_high = 0.0
        self._recent_low = float("inf")
    
    async def on_tick(self, data: dict[str, Any]) -> list[Signal]:
        price = data.get("price", 0)
        symbol = data.get("symbol", "")
        buy_dip = self.config.get("buy_dip_pct", 0.05)
        sell_gain = self.config.get("sell_gain_pct", 0.05)
        
        self._recent_high = max(self._recent_high, price)
        self._recent_low = min(self._recent_low, price)
        
        signals = []
        if self._recent_high > 0 and price <= self._recent_high * (1 - buy_dip):
            signals.append(Signal(symbol=symbol, side="BUY", strength=0.8, price=price))
            self._entry_price = price
        elif self._entry_price > 0 and price >= self._entry_price * (1 + sell_gain):
            signals.append(Signal(symbol=symbol, side="SELL", strength=0.8, price=price))
            self._entry_price = 0.0
        
        return signals
