from ..app.utils import generate_id
from datetime import datetime

class TradingService:
    """Handles order creation and matching."""
    
    def __init__(self):
        self.orders: dict = {}
        self.trades: dict = {}
    
    async def create_order(self, user_id: str, symbol: str, side: str, order_type: str, quantity: float, price: float = 0.0) -> dict:
        order_id = generate_id()
        order = {
            "id": order_id, "user_id": user_id, "symbol": symbol,
            "side": side, "type": order_type, "quantity": quantity,
            "price": price, "status": "FILLED", "created_at": datetime.now(),
        }
        self.orders[order_id] = order
        trade_id = generate_id()
        trade = {**order, "id": trade_id, "order_id": order_id, "fee": price * quantity * 0.001}
        self.trades[trade_id] = trade
        return order
    
    async def cancel_order(self, order_id: str) -> bool:
        if order_id in self.orders:
            self.orders[order_id]["status"] = "CANCELLED"
            return True
        return False
    
    async def get_positions(self, user_id: str) -> list[dict]:
        positions: dict = {}
        for t in self.trades.values():
            if t.get("user_id") != user_id or t["status"] != "FILLED":
                continue
            sym = t["symbol"]
            if sym not in positions:
                positions[sym] = {"symbol": sym, "quantity": 0.0, "avg_price": 0.0}
            p = positions[sym]
            if t["side"] == "BUY":
                total = p["avg_price"] * p["quantity"] + t["price"] * t["quantity"]
                p["quantity"] += t["quantity"]
                p["avg_price"] = total / p["quantity"] if p["quantity"] > 0 else 0
            else:
                p["quantity"] -= t["quantity"]
        return [p for p in positions.values() if p["quantity"] > 0]
