from typing import Any

class DataCleaner:
    """Cleans and validates market data."""
    
    def clean_klines(self, klines: list[dict]) -> list[dict]:
        cleaned = []
        for k in klines:
            if not all(k.get(f) for f in ["open", "high", "low", "close"]):
                continue
            o, h, l, c = float(k["open"]), float(k["high"]), float(k["low"]), float(k["close"])
            if o <= 0 or h <= 0 or l <= 0 or c <= 0:
                continue
            if h < l:
                k["high"], k["low"] = l, h
            cleaned.append(k)
        return cleaned
    
    def clean_orderbook(self, book: dict) -> dict:
        bids = sorted([b for b in book.get("bids", []) if float(b[0]) > 0 and float(b[1]) > 0], key=lambda x: -float(x[0]))
        asks = sorted([a for a in book.get("asks", []) if float(a[0]) > 0 and float(a[1]) > 0], key=lambda x: float(x[0]))
        return {**book, "bids": bids, "asks": asks}
