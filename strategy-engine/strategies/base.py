from abc import ABC, abstractmethod
from typing import Any
from ..engine.signals import Signal

class BaseStrategy(ABC):
    """Abstract base class for all strategies."""
    
    def __init__(self, config: dict[str, Any] = None):
        self.config = config or {}
        self._name = self.__class__.__name__
        self._description = ""
        self._params_schema: dict[str, str] = {}
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def description(self) -> str:
        return self._description
    
    @property
    def params_schema(self) -> dict[str, str]:
        return self._params_schema
    
    @abstractmethod
    async def initialize(self):
        """Setup strategy resources."""
        pass
    
    @abstractmethod
    async def on_tick(self, data: dict[str, Any]) -> list[Signal]:
        """Called on each data tick. Returns list of signals."""
        pass
    
    async def on_order_filled(self, order: dict[str, Any]):
        """Callback when an order is filled."""
        pass
    
    def calculate_position_size(self, signal: Signal, portfolio: dict[str, Any]) -> float:
        """Calculate position size for a signal."""
        max_position = self.config.get("max_position_pct", 0.1) * portfolio.get("total_value", 100000)
        return min(max_position / signal.price, portfolio.get("cash_balance", 0) / signal.price) if signal.price > 0 else 0
