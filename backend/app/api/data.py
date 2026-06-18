"""数据抓取 API 端点。"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.crawler import run_full_crawl

router = APIRouter(prefix="/api/data", tags=["数据抓取"])


@router.post("/refresh", summary="刷新 A 股实时数据")
def refresh_data(db: Session = Depends(get_db)):
    """从腾讯财经抓取全量 A 股实时行情并保存到数据库。"""
    result = run_full_crawl(db)
    return {"message": "数据刷新完成", "data": result}
