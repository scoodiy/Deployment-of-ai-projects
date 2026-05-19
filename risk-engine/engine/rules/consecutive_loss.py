import uuid
from datetime import datetime

class ConsecutiveLossRule:
    """Monitor consecutive losing trades."""
    
    def __init__(self, max_consecutive_losses: int = 5):
        self.max_consecutive_losses = max_consecutive_losses
        self._consecutive_losses = 0
    
    def record_trade(self, pnl: float):
        if pnl < 0:
            self._consecutive_losses += 1
        else:
            self._consecutive_losses = 0
    
    def check(self, order: dict = None, portfolio: dict = None) -> dict | None:
        if self._consecutive_losses >= self.max_consecutive_losses:
            return {
                "id": str(uuid.uuid4()), "level": "WARNING", "rule": "consecutive_loss",
                "message": f"Consecutive losses ({self._consecutive_losses}) reached limit ({self.max_consecutive_losses})",
                "value": self._consecutive_losses, "threshold": self.max_consecutive_losses,
                "timestamp": datetime.now().isoformat(),
            }
        return None
