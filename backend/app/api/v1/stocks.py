from fastapi import APIRouter
import random
from datetime import datetime, timedelta

router = APIRouter(prefix="/stocks", tags=["stocks"])

def _mock_ticker(symbol: str) -> dict:
    base_price = random.uniform(10, 200)
    return {
        "symbol": symbol, "price": round(base_price, 2),
        "volume": round(random.uniform(1e6, 1e8), 0),
        "change_24h": round(random.uniform(-5, 5), 2),
        "timestamp": datetime.now().isoformat(),
    }

@router.get("/market/{symbol}")
async def get_stock_market(symbol: str):
    return _mock_ticker(symbol)

@router.get("/klines/{symbol}")
async def get_stock_klines(symbol: str, interval: str = "1d", limit: int = 100):
    klines = []
    base = random.uniform(50, 150)
    for i in range(limit):
        ts = datetime.now() - timedelta(days=limit - i)
        o = base + random.uniform(-5, 5)
        c = o + random.uniform(-3, 3)
        klines.append({
            "symbol": symbol, "open": round(o, 2), "high": round(max(o, c) + random.uniform(0, 2), 2),
            "low": round(min(o, c) - random.uniform(0, 2), 2), "close": round(c, 2),
            "volume": round(random.uniform(1e5, 1e7), 0), "interval": interval, "timestamp": ts.isoformat(),
        })
        base = c
    return klines

@router.get("/search")
async def search_stocks(q: str = ""):
    stocks = [
        {"symbol": "600519", "name": "贵州茅台", "exchange": "SH"},
        {"symbol": "000858", "name": "五粮液", "exchange": "SZ"},
        {"symbol": "601318", "name": "中国平安", "exchange": "SH"},
        {"symbol": "000333", "name": "美的集团", "exchange": "SZ"},
        {"symbol": "600036", "name": "招商银行", "exchange": "SH"},
    ]
    if q:
        stocks = [s for s in stocks if q.lower() in s["symbol"] or q.lower() in s["name"].lower()]
    return stocks

@router.get("/financials/{symbol}")
async def get_financials(symbol: str):
    return {
        "symbol": symbol, "pe_ratio": round(random.uniform(5, 50), 2),
        "pb_ratio": round(random.uniform(0.5, 10), 2),
        "revenue": round(random.uniform(1e9, 1e12), 0),
        "net_profit": round(random.uniform(1e8, 1e11), 0),
        "roe": round(random.uniform(5, 30), 2),
    }
