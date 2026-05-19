from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/qa", tags=["qa"])

class QARequest(BaseModel):
    question: str
    context: Optional[str] = None

@router.post("/ask")
async def ask_question(req: QARequest):
    q = req.question.lower()
    if any(w in q for w in ["策略", "strategy", "网格", "马丁"]):
        answer = "量化交易策略包括：1) 网格策略 - 在固定价格区间内自动低买高卖；2) 马丁格尔策略 - 亏损后加倍仓位；3) 趋势跟踪 - 基于技术指标跟随趋势。建议根据市场环境选择合适的策略。"
        sources = ["strategy_guide.md", "grid_trading.pdf"]
    elif any(w in q for w in ["风险", "risk", "止损", "风控"]):
        answer = "风险管理要点：1) 设置仓位上限（建议单笔不超过总资金2%）；2) 使用止损单限制损失；3) 监控最大回撤（建议<20%）；4) 连续亏损时暂停交易。"
        sources = ["risk_management.md"]
    elif any(w in q for w in ["k线", "kline", "技术分析", "均线"]):
        answer = "K线分析基础：1) 阳线表示上涨，阴线表示下跌；2) 常用均线：EMA5/10/20/60；3) 金叉（短均线上穿长均线）为买入信号；4) 死叉为卖出信号。"
        sources = ["technical_analysis.md"]
    else:
        answer = f"关于「{req.question}」：这是一个很好的问题。建议您查看我们的知识库获取详细信息，或联系客服获取专业建议。"
        sources = ["faq.md"]
    return {"answer": answer, "sources": sources, "confidence": 0.85}
