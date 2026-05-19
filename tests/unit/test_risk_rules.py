import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'risk-engine'))

from engine.rules.position_limit import PositionLimitRule
from engine.rules.daily_loss import DailyLossRule
from engine.rules.consecutive_loss import ConsecutiveLossRule
from engine.rules.circuit_breaker import CircuitBreakerRule
from engine.rules.api_monitor import ApiMonitorRule

class TestPositionLimitRule:
    def test_within_limit(self):
        rule = PositionLimitRule(max_position_size=100000)
        alert = rule.check({"quantity": 1, "price": 50000}, {"positions": []})
        assert alert is None
    
    def test_exceeds_limit(self):
        rule = PositionLimitRule(max_position_size=100000)
        alert = rule.check({"quantity": 2, "price": 60000}, {"positions": []})
        assert alert is not None
        assert alert["level"] == "WARNING"

class TestDailyLossRule:
    def test_no_alert_within_limit(self):
        rule = DailyLossRule(max_daily_loss=10000)
        rule.update_pnl(-5000)
        alert = rule.check()
        assert alert is None
    
    def test_alert_exceeds_limit(self):
        rule = DailyLossRule(max_daily_loss=10000)
        rule.update_pnl(-12000)
        alert = rule.check()
        assert alert is not None
        assert alert["level"] == "CRITICAL"

class TestConsecutiveLossRule:
    def test_no_alert_under_limit(self):
        rule = ConsecutiveLossRule(max_consecutive_losses=5)
        for _ in range(3):
            rule.record_trade(-100)
        alert = rule.check()
        assert alert is None
    
    def test_alert_at_limit(self):
        rule = ConsecutiveLossRule(max_consecutive_losses=3)
        for _ in range(3):
            rule.record_trade(-100)
        alert = rule.check()
        assert alert is not None
    
    def test_reset_on_win(self):
        rule = ConsecutiveLossRule(max_consecutive_losses=3)
        rule.record_trade(-100)
        rule.record_trade(-100)
        rule.record_trade(100)
        assert rule._consecutive_losses == 0

class TestCircuitBreakerRule:
    def test_not_triggered_initially(self):
        rule = CircuitBreakerRule(circuit_breaker_loss_pct=15.0)
        rule.set_initial_value(100000)
        alert = rule.check(portfolio={"total_value": 90000})
        assert alert is None
    
    def test_triggered_on_big_loss(self):
        rule = CircuitBreakerRule(circuit_breaker_loss_pct=15.0)
        rule.set_initial_value(100000)
        alert = rule.check(portfolio={"total_value": 84000})
        assert alert is not None
        assert rule.is_triggered
    
    def test_reset(self):
        rule = CircuitBreakerRule()
        rule._is_triggered = True
        rule.reset()
        assert not rule.is_triggered

class TestApiMonitorRule:
    def test_no_alert_with_good_stats(self):
        rule = ApiMonitorRule(max_error_rate=0.1, max_latency_ms=5000)
        for _ in range(10):
            rule.record_call(True, 100)
        alert = rule.check()
        assert alert is None
    
    def test_alert_on_high_error_rate(self):
        rule = ApiMonitorRule(max_error_rate=0.1)
        for _ in range(5):
            rule.record_call(False, 100)
        for _ in range(5):
            rule.record_call(True, 100)
        alert = rule.check()
        assert alert is not None
