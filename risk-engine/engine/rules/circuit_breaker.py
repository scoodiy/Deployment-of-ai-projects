import uuid
from datetime import datetime

class CircuitBreakerRule:
    """Emergency stop when total loss exceeds threshold."""
    
    def __init__(self, circuit_breaker_loss_pct: float = 15.0):
        self.circuit_breaker_loss_pct = circuit_breaker_loss_pct
        self._is_triggered = False
        self._initial_value: float = 0.0
    
    def set_initial_value(self, value: float):
        self._initial_value = value
    
    def check(self, order: dict = None, portfolio: dict = None) -> dict | None:
        if self._is_triggered:
            return {
                "id": str(uuid.uuid4()), "level": "CRITICAL", "rule": "circuit_breaker",
                "message": "Circuit breaker is TRIGGERED. All trading halted.",
                "value": 100.0, "threshold": self.circuit_breaker_loss_pct,
                "timestamp": datetime.now().isoformat(),
            }
        
        if portfolio and self._initial_value > 0:
            current_value = portfolio.get("total_value", 0)
            loss_pct = (self._initial_value - current_value) / self._initial_value * 100
            if loss_pct >= self.circuit_breaker_loss_pct:
                self._is_triggered = True
                return {
                    "id": str(uuid.uuid4()), "level": "CRITICAL", "rule": "circuit_breaker",
                    "message": f"Loss {loss_pct:.1f}% triggered circuit breaker at {self.circuit_breaker_loss_pct}%",
                    "value": loss_pct, "threshold": self.circuit_breaker_loss_pct,
                    "timestamp": datetime.now().isoformat(),
                }
        return None
    
    def reset(self):
        self._is_triggered = False
    
    @property
    def is_triggered(self) -> bool:
        return self._is_triggered
