import re
from typing import Tuple

class IntentClassifier:
    """Classifies user query intent using keyword matching."""
    
    INTENTS = {
        "market_data": ["价格", "行情", "涨跌", "走势", "k线", "kline", "price", "market", "ticker"],
        "strategy_help": ["策略", "网格", "马丁", "趋势", "均线", "strategy", "grid", "martingale", "ema"],
        "risk_question": ["风险", "止损", "回撤", "风控", "爆仓", "risk", "stop loss", "drawdown"],
        "portfolio_question": ["持仓", "仓位", "收益", "盈亏", "portfolio", "position", "pnl"],
        "general": [],
    }
    
    def classify(self, text: str) -> Tuple[str, float]:
        text_lower = text.lower()
        scores: dict[str, float] = {}
        
        for intent, keywords in self.INTENTS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[intent] = score / len(keywords) if keywords else 0
        
        if not scores:
            return ("general", 0.3)
        
        best = max(scores, key=scores.get)
        return (best, min(scores[best] + 0.3, 1.0))
