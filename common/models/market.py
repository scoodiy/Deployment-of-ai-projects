from pydantic import BaseModel
from datetime import datetime

class Ticker(BaseModel):
    symbol: str
    price: float
    volume: float
    change_24h: float
    timestamp: datetime

class Kline(BaseModel):
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    interval: str
    timestamp: datetime

class OrderBook(BaseModel):
    symbol: str
    bids: list[list[float]]
    asks: list[list[float]]
    timestamp: datetime

class MarketDepth(BaseModel):
    symbol: str
    bid_total: float
    ask_total: float
    spread: float
    timestamp: datetime
