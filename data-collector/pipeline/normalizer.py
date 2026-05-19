from datetime import datetime

class DataNormalizer:
    """Normalizes data across different sources."""
    
    def normalize_klines(self, klines: list[dict], target_interval: str = "1d") -> list[dict]:
        return klines  # Passthrough for now
    
    def normalize_symbol(self, symbol: str, from_exchange: str, to_exchange: str) -> str:
        mappings = {
            ("binance", "okx"): lambda s: s.replace("USDT", "-USDT"),
            ("okx", "binance"): lambda s: s.replace("-USDT", "USDT"),
        }
        converter = mappings.get((from_exchange, to_exchange))
        return converter(symbol) if converter else symbol
