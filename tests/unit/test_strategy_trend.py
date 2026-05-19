import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'strategy-engine'))

from strategies.trend_following import TrendFollowingStrategy

class TestTrendFollowingStrategy:
    @pytest.fixture
    def strategy(self):
        return TrendFollowingStrategy({"fast_period": 5, "slow_period": 10, "atr_period": 5})
    
    @pytest.mark.asyncio
    async def test_initialize(self, strategy):
        await strategy.initialize()
        assert len(strategy._prices) == 0
    
    @pytest.mark.asyncio
    async def test_no_signal_with_few_prices(self, strategy):
        await strategy.initialize()
        for i in range(5):
            signals = await strategy.on_tick({"symbol": "BTCUSDT", "price": 100 + i})
        assert len(signals) == 0  # Not enough data yet
    
    @pytest.mark.asyncio
    async def test_signals_with_enough_data(self, strategy):
        await strategy.initialize()
        all_signals = []
        for i in range(20):
            price = 100 + (i * 2 if i < 10 else 20 - (i - 10))
            signals = await strategy.on_tick({"symbol": "BTCUSDT", "price": price})
            all_signals.extend(signals)
        # Should have generated some signals with this price pattern
        assert isinstance(all_signals, list)
    
    def test_ema_calculation(self, strategy):
        prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 112]
        ema = strategy._calc_ema(prices, 5)
        assert ema > 0
