from typing import Any
from .base import BaseStrategy
from ..engine.signals import Signal

class TrendFollowingStrategy(BaseStrategy):
    """Trend following with EMA crossover and ATR stop loss."""
    
    def __init__(self, config: dict[str, Any] = None):
        super().__init__(config)
        self._name = "TrendFollowingStrategy"
        self._description = "Uses EMA crossover with ATR-based stop loss"
        self._params_schema = {
            "fast_period": "int - Fast EMA period (default 12)",
            "slow_period": "int - Slow EMA period (default 26)",
            "atr_period": "int - ATR period (default 14)",
            "atr_multiplier": "float - ATR multiplier for stop loss (default 2.0)",
        }
        self._prices: list[float] = []
        self._fast_ema: float = 0.0
        self._slow_ema: float = 0.0
        self._prev_fast_ema: float = 0.0
        self._prev_slow_ema: float = 0.0
        self._atr: float = 0.0
    
    def _calc_ema(self, prices: list[float], period: int) -> float:
        if len(prices) < period:
            return sum(prices) / len(prices) if prices else 0
        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period
        for price in prices[period:]:
            ema = (price - ema) * multiplier + ema
        return ema
    
    def _calc_atr(self, prices: list[float], period: int) -> float:
        if len(prices) < 2:
            return 0
        ranges = [abs(prices[i] - prices[i-1]) for i in range(1, len(prices))]
        return sum(ranges[-period:]) / min(len(ranges), period)
    
    async def initialize(self):
        self._prices = []
    
    async def on_tick(self, data: dict[str, Any]) -> list[Signal]:
        price = data.get("price", 0)
        symbol = data.get("symbol", "")
        self._prices.append(price)
        
        fast_period = self.config.get("fast_period", 12)
        slow_period = self.config.get("slow_period", 26)
        
        if len(self._prices) < slow_period:
            return []
        
        self._prev_fast_ema = self._fast_ema
        self._prev_slow_ema = self._slow_ema
        self._fast_ema = self._calc_ema(self._prices, fast_period)
        self._slow_ema = self._calc_ema(self._prices, slow_period)
        self._atr = self._calc_atr(self._prices, self.config.get("atr_period", 14))
        
        signals = []
        if self._prev_fast_ema <= self._prev_slow_ema and self._fast_ema > self._slow_ema:
            strength = min(abs(self._fast_ema - self._slow_ema) / self._slow_ema * 10, 1.0)
            signals.append(Signal(symbol=symbol, side="BUY", strength=strength, price=price,
                                  metadata={"atr": self._atr, "stop_loss": price - self._atr * self.config.get("atr_multiplier", 2.0)}))
        elif self._prev_fast_ema >= self._prev_slow_ema and self._fast_ema < self._slow_ema:
            strength = min(abs(self._slow_ema - self._fast_ema) / self._slow_ema * 10, 1.0)
            signals.append(Signal(symbol=symbol, side="SELL", strength=strength, price=price,
                                  metadata={"atr": self._atr, "stop_loss": price + self._atr * self.config.get("atr_multiplier", 2.0)}))
        return signals
