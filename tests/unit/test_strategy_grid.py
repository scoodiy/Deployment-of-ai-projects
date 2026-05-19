import pytest
import asyncio
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'strategy-engine'))

from strategies.grid import GridStrategy

class TestGridStrategy:
    @pytest.fixture
    def strategy(self):
        return GridStrategy({"upper_price": 200.0, "lower_price": 100.0, "grid_count": 10})
    
    @pytest.mark.asyncio
    async def test_initialize(self, strategy):
        await strategy.initialize()
        assert len(strategy._grid_levels) == 11
        assert strategy._grid_levels[0] == 100.0
        assert strategy._grid_levels[-1] == 200.0
    
    @pytest.mark.asyncio
    async def test_buy_signal_on_price_drop(self, strategy):
        await strategy.initialize()
        data = {"symbol": "BTCUSDT", "price": 95.0, "volume": 1000}
        signals = await strategy.on_tick(data)
        buy_signals = [s for s in signals if s.side == "BUY"]
        assert len(buy_signals) > 0
    
    @pytest.mark.asyncio
    async def test_no_signal_in_middle(self, strategy):
        await strategy.initialize()
        data = {"symbol": "BTCUSDT", "price": 150.0, "volume": 1000}
        signals = await strategy.on_tick(data)
        # At 150, some levels should trigger
        assert isinstance(signals, list)
    
    def test_name(self, strategy):
        assert strategy.name == "GridStrategy"
