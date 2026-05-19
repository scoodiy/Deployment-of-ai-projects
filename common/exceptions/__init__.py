class TradingBotError(Exception):
    """Base exception for trading bot."""
    pass

class DataFetchError(TradingBotError):
    """Error fetching market data."""
    pass

class OrderError(TradingBotError):
    """Error placing or managing orders."""
    pass

class RiskViolationError(TradingBotError):
    """Risk limit violation."""
    pass

class StrategyError(TradingBotError):
    """Strategy execution error."""
    pass

class AuthenticationError(TradingBotError):
    """Authentication failed."""
    pass

class ConfigurationError(TradingBotError):
    """Invalid configuration."""
    pass
