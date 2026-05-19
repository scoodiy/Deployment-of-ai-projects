# 不要在 __init__ 里复制 base 的值，保持延迟引用
from .base import Base, is_database_available
from .tables import User, Trade, Strategy, RiskRule
