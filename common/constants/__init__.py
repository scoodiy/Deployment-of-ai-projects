from enum import Enum

class Exchange(str, Enum):
    BINANCE = "binance"
    OKX = "okx"
    BYBIT = "bybit"
    EASTMONEY = "eastmoney"
    TONGHUASHUN = "tonghuashun"

class TimeFrame(str, Enum):
    M1 = "1m"
    M5 = "5m"
    M15 = "15m"
    H1 = "1h"
    H4 = "4h"
    D1 = "1d"

DEFAULT_API_TIMEOUT = 30
DEFAULT_RETRY_COUNT = 3
DEFAULT_RETRY_DELAY = 1.0
MAX_ORDER_SIZE = 1000000
MIN_ORDER_SIZE = 0.001
