import uuid
import time
from datetime import datetime
from collections import deque

class ApiMonitorRule:
    """Monitor API error rates and latency."""
    
    def __init__(self, max_error_rate: float = 0.1, max_latency_ms: float = 5000.0, window_size: int = 100):
        self.max_error_rate = max_error_rate
        self.max_latency_ms = max_latency_ms
        self._calls: deque = deque(maxlen=window_size)
    
    def record_call(self, success: bool, latency_ms: float):
        self._calls.append({"success": success, "latency_ms": latency_ms, "timestamp": time.time()})
    
    def check(self, order: dict = None, portfolio: dict = None) -> dict | None:
        if not self._calls:
            return None
        
        error_rate = sum(1 for c in self._calls if not c["success"]) / len(self._calls)
        avg_latency = sum(c["latency_ms"] for c in self._calls) / len(self._calls)
        
        if error_rate > self.max_error_rate:
            return {
                "id": str(uuid.uuid4()), "level": "WARNING", "rule": "api_monitor",
                "message": f"API error rate {error_rate:.1%} exceeds threshold {self.max_error_rate:.1%}",
                "value": error_rate * 100, "threshold": self.max_error_rate * 100,
                "timestamp": datetime.now().isoformat(),
            }
        if avg_latency > self.max_latency_ms:
            return {
                "id": str(uuid.uuid4()), "level": "WARNING", "rule": "api_monitor",
                "message": f"API latency {avg_latency:.0f}ms exceeds threshold {self.max_latency_ms:.0f}ms",
                "value": avg_latency, "threshold": self.max_latency_ms,
                "timestamp": datetime.now().isoformat(),
            }
        return None
