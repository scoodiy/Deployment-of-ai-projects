import uuid
from datetime import datetime, date

class DailyLossRule:
    """Track and limit daily losses."""
    
    def __init__(self, max_daily_loss: float = 10000.0):
        self.max_daily_loss = max_daily_loss
        self._daily_pnl: float = 0.0
        self._last_date: date | None = None
    
    def update_pnl(self, pnl: float):
        today = date.today()
        if self._last_date != today:
            self._daily_pnl = 0.0
            self._last_date = today
        self._daily_pnl += pnl
    
    def check(self, order: dict = None, portfolio: dict = None) -> dict | None:
        today = date.today()
        if self._last_date != today:
            self._daily_pnl = 0.0
            self._last_date = today
        
        if self._daily_pnl < -self.max_daily_loss:
            return {
                "id": str(uuid.uuid4()), "level": "CRITICAL", "rule": "daily_loss",
                "message": f"Daily loss {abs(self._daily_pnl):.2f} exceeds limit {self.max_daily_loss:.2f}",
                "value": abs(self._daily_pnl), "threshold": self.max_daily_loss,
                "timestamp": datetime.now().isoformat(),
            }
        return None
