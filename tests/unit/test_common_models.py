import pytest
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from common.models.market import Ticker, Kline, OrderBook
from common.models.trade import TradeOrder, Position, Portfolio, OrderSide, OrderType, OrderStatus
from common.models.risk import RiskMetrics, RiskAlert, AlertLevel, RiskLimits

class TestTicker:
    def test_create_ticker(self):
        t = Ticker(symbol="BTCUSDT", price=65000.0, volume=1e9, change_24h=2.5, timestamp=datetime.now())
        assert t.symbol == "BTCUSDT"
        assert t.price == 65000.0

    def test_ticker_defaults(self):
        t = Ticker(symbol="ETHUSDT", price=3500, volume=1e8, change_24h=-1.2, timestamp=datetime.now())
        assert t.change_24h == -1.2

class TestKline:
    def test_create_kline(self):
        k = Kline(symbol="BTCUSDT", open=64000, high=66000, low=63500, close=65500,
                  volume=1e8, interval="1h", timestamp=datetime.now())
        assert k.high > k.low
        assert k.open > 0

class TestTradeOrder:
    def test_create_order(self):
        o = TradeOrder(id="test-1", symbol="BTCUSDT", side=OrderSide.BUY, type=OrderType.LIMIT,
                       quantity=1.0, price=65000.0)
        assert o.status == OrderStatus.PENDING
        assert o.side == OrderSide.BUY

    def test_order_types(self):
        for t in OrderType:
            o = TradeOrder(id="test", symbol="BTC", side=OrderSide.BUY, type=t, quantity=1.0)
            assert o.type == t

class TestPosition:
    def test_create_position(self):
        p = Position(symbol="BTCUSDT", side=OrderSide.BUY, quantity=1.5, avg_price=64000.0)
        assert p.unrealized_pnl == 0.0

class TestPortfolio:
    def test_empty_portfolio(self):
        p = Portfolio()
        assert p.total_value == 0.0
        assert len(p.positions) == 0

class TestRiskModels:
    def test_risk_metrics(self):
        m = RiskMetrics(max_drawdown=15.0, sharpe_ratio=1.5, win_rate=60.0)
        assert m.total_trades == 0

    def test_risk_alert(self):
        a = RiskAlert(id="a1", level=AlertLevel.WARNING, rule="daily_loss", message="test", value=8000, threshold=10000)
        assert a.level == AlertLevel.WARNING

    def test_risk_limits(self):
        l = RiskLimits()
        assert l.max_position_size == 100000.0
        assert l.max_consecutive_losses == 5
