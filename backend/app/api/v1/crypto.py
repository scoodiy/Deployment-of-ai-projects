from fastapi import APIRouter
import random
from datetime import datetime, timedelta

router = APIRouter(prefix="/crypto", tags=["crypto"])

def _mock_crypto_ticker(symbol: str) -> dict:
    prices = {"BTCUSDT": 65000, "ETHUSDT": 3500, "BNBUSDT": 600, "SOLUSDT": 150, "XRPUSDT": 0.6}
    base = prices.get(symbol, 100)
    return {
        "symbol": symbol, "price": round(base * (1 + random.uniform(-0.05, 0.05)), 2),
        "volume": round(random.uniform(1e8, 1e10), 0),
        "change_24h": round(random.uniform(-10, 10), 2),
        "timestamp": datetime.now().isoformat(),
    }

@router.get("/market/{symbol}")
async def get_crypto_market(symbol: str):
    return _mock_crypto_ticker(symbol)

@router.get("/klines/{symbol}")
async def get_crypto_klines(symbol: str, interval: str = "1h", limit: int = 100):
    klines = []
    base = {"BTCUSDT": 65000, "ETHUSDT": 3500}.get(symbol, 100)
    for i in range(limit):
        ts = datetime.now() - timedelta(hours=limit - i)
        o = base * (1 + random.uniform(-0.02, 0.02))
        c = o * (1 + random.uniform(-0.01, 0.01))
        klines.append({
            "symbol": symbol, "open": round(o, 2), "high": round(max(o, c) * 1.005, 2),
            "low": round(min(o, c) * 0.995, 2), "close": round(c, 2),
            "volume": round(random.uniform(1e3, 1e6), 2), "interval": interval, "timestamp": ts.isoformat(),
        })
        base = c
    return klines

@router.get("/orderbook/{symbol}")
async def get_orderbook(symbol: str, limit: int = 20):
    base = {"BTCUSDT": 65000, "ETHUSDT": 3500}.get(symbol, 100)
    bids = [[round(base * (1 - 0.001 * i), 2), round(random.uniform(0.1, 10), 4)] for i in range(1, limit + 1)]
    asks = [[round(base * (1 + 0.001 * i), 2), round(random.uniform(0.1, 10), 4)] for i in range(1, limit + 1)]
    return {"symbol": symbol, "bids": bids, "asks": asks, "timestamp": datetime.now().isoformat()}

@router.get("/exchanges")
async def list_exchanges():
    return [
        {"id": "binance", "name": "Binance", "symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]},
        {"id": "okx", "name": "OKX", "symbols": ["BTC-USDT", "ETH-USDT", "SOL-USDT"]},
        {"id": "bybit", "name": "Bybit", "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"]},
    ]
