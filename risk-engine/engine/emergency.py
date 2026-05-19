import asyncio
import logging
from datetime import datetime

logger = logging.getLogger("emergency")

class EmergencyHandler:
    """Handles emergency trading halts."""
    
    def __init__(self):
        self._halted = False
        self._halt_reason = ""
        self._halt_time: datetime | None = None
        self._log: list[dict] = []
    
    async def halt_trading(self, reason: str):
        self._halted = True
        self._halt_reason = reason
        self._halt_time = datetime.now()
        self._log.append({"action": "halt", "reason": reason, "timestamp": self._halt_time.isoformat()})
        logger.critical(f"TRADING HALTED: {reason}")
    
    async def resume_trading(self):
        self._halted = False
        self._halt_reason = ""
        self._log.append({"action": "resume", "timestamp": datetime.now().isoformat()})
        logger.info("Trading resumed")
    
    def is_halted(self) -> bool:
        return self._halted
    
    def get_status(self) -> dict:
        return {
            "halted": self._halted,
            "reason": self._halt_reason,
            "halt_time": self._halt_time.isoformat() if self._halt_time else None,
            "log": self._log,
        }
