from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

@dataclass
class Signal:
    symbol: str
    side: str  # BUY or SELL
    strength: float  # 0.0 to 1.0
    price: float
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: dict[str, Any] = field(default_factory=dict)

def combine_signals(signals: list[Signal]) -> Signal | None:
    """Merge multiple signals into one weighted signal."""
    if not signals:
        return None
    buy_strength = sum(s.strength for s in signals if s.side == "BUY")
    sell_strength = sum(s.strength for s in signals if s.side == "SELL")
    if buy_strength > sell_strength:
        avg_price = sum(s.price * s.strength for s in signals if s.side == "BUY") / buy_strength if buy_strength else 0
        return Signal(symbol=signals[0].symbol, side="BUY", strength=min(buy_strength / len(signals), 1.0), price=avg_price)
    elif sell_strength > buy_strength:
        avg_price = sum(s.price * s.strength for s in signals if s.side == "SELL") / sell_strength if sell_strength else 0
        return Signal(symbol=signals[0].symbol, side="SELL", strength=min(sell_strength / len(signals), 1.0), price=avg_price)
    return None

def filter_signals(signals: list[Signal], min_strength: float = 0.5) -> list[Signal]:
    """Filter signals by minimum strength."""
    return [s for s in signals if s.strength >= min_strength]
