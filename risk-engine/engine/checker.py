from .rules import PositionLimitRule, DailyLossRule, ConsecutiveLossRule, CircuitBreakerRule, ApiMonitorRule
import uuid
from datetime import datetime

class RiskChecker:
    """Aggregates all risk rules and checks orders."""
    
    def __init__(self, limits: dict = None):
        limits = limits or {}
        self.rules = [
            PositionLimitRule(limits.get("max_position_size", 100000.0)),
            DailyLossRule(limits.get("max_daily_loss", 10000.0)),
            ConsecutiveLossRule(limits.get("max_consecutive_losses", 5)),
            CircuitBreakerRule(limits.get("circuit_breaker_loss", 15.0)),
            ApiMonitorRule(),
        ]
        self._alerts: list[dict] = []
    
    async def check_order(self, order: dict, portfolio: dict) -> tuple[bool, list[dict]]:
        alerts = []
        for rule in self.rules:
            alert = rule.check(order, portfolio)
            if alert:
                alerts.append(alert)
                self._alerts.append(alert)
        
        critical = any(a["level"] == "CRITICAL" for a in alerts)
        return (not critical, alerts)
    
    def get_alerts(self, level: str = None) -> list[dict]:
        if level:
            return [a for a in self._alerts if a["level"] == level]
        return self._alerts
    
    def record_trade_result(self, pnl: float):
        for rule in self.rules:
            if isinstance(rule, DailyLossRule):
                rule.update_pnl(pnl)
            elif isinstance(rule, ConsecutiveLossRule):
                rule.record_trade(pnl)
