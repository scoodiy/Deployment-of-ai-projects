"""应用配置模块。"""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置，从环境变量加载。"""

    # 数据库
    DATABASE_URL: str = ""

    # PostgreSQL 单独参数（当 DATABASE_URL 为空时使用）
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "your_password_here"
    DB_DATABASE: str = "postgres"

    # 应用
    APP_NAME: str = "Stock-AYUU"
    SECRET_KEY: str = "change-this-to-a-random-secret-key"
    DEBUG: bool = False

    # 后端端口
    BACKEND_PORT: int = 9988

    @property
    def cors_origins(self) -> list[str]:
        """解析 CORS_ORIGINS — 支持逗号分隔字符串或 JSON 数组。"""
        raw = os.environ.get("CORS_ORIGINS", "https://ayuu.fun,http://localhost:5173,http://localhost:9988")
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def resolved_database_url(self) -> str:
        """解析数据库连接 URL。优先使用 DATABASE_URL，否则用单独参数构建。"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"
        )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """获取缓存的配置实例。"""
    return Settings()
