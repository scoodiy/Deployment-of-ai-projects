import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'data-collector'))

from pipeline.cleaner import DataCleaner

class TestDataCleaner:
    def test_clean_klines_removes_invalid(self):
        cleaner = DataCleaner()
        klines = [
            {"open": 100, "high": 110, "low": 90, "close": 105, "volume": 1000},
            {"open": 0, "high": 110, "low": 90, "close": 105, "volume": 1000},
            {"open": 100, "high": 110, "low": 90, "close": 105, "volume": 0},
        ]
        result = cleaner.clean_klines(klines)
        assert len(result) == 2
    
    def test_clean_klines_fixes_inverted_hl(self):
        cleaner = DataCleaner()
        klines = [{"open": 100, "high": 90, "low": 110, "close": 105, "volume": 1000}]
        result = cleaner.clean_klines(klines)
        assert result[0]["high"] >= result[0]["low"]
    
    def test_clean_orderbook(self):
        cleaner = DataCleaner()
        book = {"bids": [[100, 1], [99, 2]], "asks": [[101, 1], [102, 2]]}
        result = cleaner.clean_orderbook(book)
        assert len(result["bids"]) == 2
        assert len(result["asks"]) == 2
