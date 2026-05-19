import uuid
from datetime import datetime

class PositionLimitRule:
    """Check if order exceeds max position size."""
    
    def __init__(self, max_position_size: float = 100000.0):
        self.max_position_size = max_position_size
    
    def check(self, order: dict, portfolio: dict) -> dict | None:
        order_value = order.get("quantity", 0) * order.get("price", 0)
        current_positions = portfolio.get("positions", [])
        current_value = sum(p.get("quantity", 0) * p.get("avg_price", 0) for p in current_positions)
        
        if current_value + order_value > self.max_position_size:
            return {
                "id": str(uuid.uuid4()), "level": "WARNING", "rule": "position_limit",
                "message": f"Order value {order_value:.2f} would exceed position limit {self.max_position_size:.2f}",
                "value": current_value + order_value, "threshold": self.max_position_size,
                "timestamp": datetime.now().isoformat(),
            }
        return None
