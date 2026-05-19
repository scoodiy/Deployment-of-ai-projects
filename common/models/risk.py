from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class AlertLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class RiskMetrics(BaseModel):
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    var_95: float = 0.0
    total_trades: int = 0
    consecutive_losses: int = 0

class RiskAlert(BaseModel):
    id: str
    level: AlertLevel
    rule: str
    message: str
    symbol: str = ""
    value: float = 0.0
    threshold: float = 0.0
    timestamp: datetime = datetime.now()

class RiskLimits(BaseModel):
    max_position_size: float = 100000.0
    max_daily_loss: float = 10000.0
    max_consecutive_losses: int = 5
    max_drawdown_pct: float = 20.0
    circuit_breaker_loss: float = 15.0
