"""数据抓取 API 端点。"""

import os
import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.crawler import run_full_crawl

logger = logging.getLogger("stock-ayuu")
router = APIRouter(prefix="/api/data", tags=["数据抓取"])

REFRESH_TOKEN = os.environ.get("REFRESH_TOKEN", "")


@router.post("/refresh", summary="刷新 A 股实时数据")
def refresh_data(db: Session = Depends(get_db), x_refresh_token: str | None = Header(None)):
    """从腾讯财经抓取全量 A 股实时行情并保存到数据库。

    需要在请求头中携带 X-Refresh-Token 进行身份验证。
    通过环境变量 REFRESH_TOKEN 配置。
    """
    if not REFRESH_TOKEN:
        logger.warning("REFRESH_TOKEN 未配置，/api/data/refresh 端点将被禁用")
        raise HTTPException(status_code=503, detail="数据刷新服务未配置")
    if not x_refresh_token or x_refresh_token != REFRESH_TOKEN:
        raise HTTPException(status_code=403, detail="无效的刷新令牌")
    result = run_full_crawl(db)
    return {"message": "数据刷新完成", "data": result}
