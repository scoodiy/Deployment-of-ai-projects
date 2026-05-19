from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Quant Trading Bot"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = "b2a8035045766514ac01dd8930a16c62d9c4365875f7198582cbac351d1b22e0"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ayuu.fun",
        "https://comforting-peony-4504bd.netlify.app",
        "https://deployment-of-ai-projects.vercel.app",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
