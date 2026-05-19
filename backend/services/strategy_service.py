from ..app.utils import generate_id

class StrategyService:
    """Manages trading strategies."""
    
    def __init__(self):
        self.strategies: dict = {}
    
    async def create(self, user_id: str, name: str, strategy_type: str, params: dict) -> dict:
        sid = generate_id()
        s = {"id": sid, "user_id": user_id, "name": name, "type": strategy_type, "params": params, "is_active": False}
        self.strategies[sid] = s
        return s
    
    async def activate(self, strategy_id: str) -> bool:
        if strategy_id in self.strategies:
            self.strategies[strategy_id]["is_active"] = True
            return True
        return False
    
    async def deactivate(self, strategy_id: str) -> bool:
        if strategy_id in self.strategies:
            self.strategies[strategy_id]["is_active"] = False
            return True
        return False
