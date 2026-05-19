from datetime import datetime, timedelta
import random

class AnnouncementCollector:
    """Collects company announcements."""
    
    async def get_latest(self, symbol: str, limit: int = 10) -> list[dict]:
        templates = [
            f"{symbol} 关于股份回购的公告",
            f"{symbol} 年度报告",
            f"{symbol} 季度业绩预告",
            f"{symbol} 关于对外投资的公告",
            f"{symbol} 股东大会决议公告",
        ]
        return [
            {"symbol": symbol, "title": t, "date": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")}
            for t in templates[:limit]
        ]
