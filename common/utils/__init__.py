import uuid
import logging
import asyncio
import functools
from datetime import datetime, timezone

def timestamp_to_datetime(ts: int) -> datetime:
    """Convert millisecond timestamp to datetime."""
    return datetime.fromtimestamp(ts / 1000, tz=timezone.utc)

def datetime_to_timestamp(dt: datetime) -> int:
    """Convert datetime to millisecond timestamp."""
    return int(dt.timestamp() * 1000)

def calculate_pnl(entry: float, exit: float, quantity: float, side: str) -> float:
    """Calculate P&L for a trade."""
    if side == "BUY":
        return (exit - entry) * quantity
    return (entry - exit) * quantity

def format_number(n: float, decimals: int = 2) -> str:
    """Format number with commas and decimals."""
    return f"{n:,.{decimals}f}"

def generate_id() -> str:
    """Generate unique ID."""
    return str(uuid.uuid4())

def retry_async(max_retries: int = 3, delay: float = 1.0):
    """Async retry decorator."""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        await asyncio.sleep(delay * (attempt + 1))
            raise last_exception
        return wrapper
    return decorator

def setup_logging(name: str, level: str = "INFO") -> logging.Logger:
    """Setup structured logging."""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    if not logger.handlers:
        handler = logging.StreamHandler()
        fmt = logging.Formatter(
            "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    return logger
