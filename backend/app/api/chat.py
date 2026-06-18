"""股票知识问答 API。"""

import os
import json
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["AI问答"])

# 股票知识 System Prompt
SYSTEM_PROMPT = """你是一位专业的股票分析师助手，擅长A股市场的技术分析、基本面分析和投资策略。

你的知识涵盖：
1. **A股基础**：T+1交易制度、涨跌停板（主板±10%，创业板/科创板±20%）、ST股票、北交所等
2. **技术指标**：MACD、KDJ、RSI、BOLL（布林带）、MA（均线）、VOL（成交量）、OBV、DMI等
3. **K线形态**：锤子线、十字星、吞没形态、早晨之星、黄昏之星、三只乌鸦、红三兵等
4. **选股策略**：海龟突破、低ATR策略、突破平台、趋势跟踪、价值投资等
5. **财务分析**：市盈率(PE)、市净率(PB)、ROE、毛利率、营收增长、净利润等
6. **筹码分析**：筹码分布、获利盘、套牢盘、成本集中度等

回答要求：
- 用通俗易懂的中文回答
- 适当举例说明
- 每次回答末尾加上风险提示："⚠️ 以上内容仅供学习参考，不构成任何投资建议。股市有风险，投资需谨慎。"
- 如果问题与股票无关，尽量引导回股票相关话题
- 不要给出具体的买卖建议"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


# 常见问题内置回答
FALLBACK_ANSWERS = {
    "macd": """**MACD（指数平滑异同移动平均线）** 是最常用的技术指标之一。

**组成：**
- DIF线（快线）：12日EMA - 26日EMA
- DEA线（慢线）：DIF的9日EMA
- MACD柱：(DIF - DEA) × 2

**常见用法：**
1. **金叉买入**：DIF上穿DEA，看涨信号
2. **死叉卖出**：DIF下穿DEA，看跌信号
3. **零轴上方**：多头市场
4. **零轴下方**：空头市场
5. **顶背离**：股价创新高但MACD不创新高，可能反转
6. **底背离**：股价创新低但MACD不创新低，可能反弹

⚠️ 以上内容仅供学习参考，不构成任何投资建议。股市有风险，投资需谨慎。""",

    "k线": """**K线图（蜡烛图）** 是最基础的股票图表。

**基本构成：**
- 🟢 阳线（红色）：收盘价 > 开盘价，表示上涨
- 🔴 阴线（绿色）：收盘价 < 开盘价，表示下跌
- 实体：开盘价与收盘价之间的部分
- 上影线：实体上方的线，表示最高价
- 下影线：实体下方的线，表示最低价

**常见K线形态：**
1. **锤子线**：下影线很长，可能见底
2. **十字星**：实体很小，表示多空平衡
3. **吞没形态**：后一根K线完全包含前一根
4. **早晨之星**：三根K线组合，看涨信号
5. **黄昏之星**：三根K线组合，看跌信号

⚠️ 以上内容仅供学习参考，不构成任何投资建议。股市有风险，投资需谨慎。""",

    "市盈率": """**市盈率（PE，Price-to-Earnings Ratio）** 是最常用的估值指标。

**计算公式：** PE = 股价 / 每股收益(EPS)

**常见类型：**
- **静态PE**：用上一年度每股收益计算
- **动态PE**：用预计当年每股收益计算
- **TTM PE**：用最近四个季度每股收益计算（最常用）

**如何判断：**
- PE < 15：可能被低估
- PE 15-25：合理范围
- PE > 25：可能被高估
- 负数PE：公司亏损

**注意：** 不同行业PE差异很大，科技股PE通常高于银行股。要与同行业对比才有意义。

⚠️ 以上内容仅供学习参考，不构成任何投资建议。股市有风险，投资需谨慎。""",

    "选股": """**如何选择好股票？** 这是投资者最关心的问题之一。

**基本面分析：**
1. **盈利能力**：ROE > 15%，毛利率稳定
2. **成长性**：营收和净利润连续增长
3. **估值合理**：PE、PB在行业内合理范围
4. **现金流**：经营性现金流为正且稳定
5. **负债率**：资产负债率不过高（< 70%）

**技术面分析：**
1. **趋势**：股价在均线上方运行
2. **成交量**：放量上涨，缩量回调
3. **支撑压力**：关键位置的突破和回踩
4. **指标配合**：MACD、KDJ等指标共振

**常见选股策略：**
- 海龟突破策略
- 低ATR策略（低波动率选股）
- 突破平台策略
- 趋势跟踪策略

⚠️ 以上内容仅供学习参考，不构成任何投资建议。股市有风险，投资需谨慎。""",

    "布林带": """**布林带（BOLL，Bollinger Bands）** 是一个衡量波动率的指标。

**组成：**
- 中轨：20日移动平均线（MA20）
- 上轨：中轨 + 2倍标准差
- 下轨：中轨 - 2倍标准差

**用法：**
1. **收口**：波动率降低，可能即将突破
2. **开口**：波动率增大，趋势开始
3. **触及上轨**：可能超买，注意回调
4. **触及下轨**：可能超卖，关注反弹
5. **沿上轨运行**：强势上涨
6. **沿下轨运行**：持续下跌

⚠️ 以上内容仅供学习参考，不构成任何投资建议。股市有风险，投资需谨慎。""",
}


def _find_fallback(question: str) -> str | None:
    """查找内置回答。"""
    q = question.lower()
    for keyword, answer in FALLBACK_ANSWERS.items():
        if keyword in q:
            return answer
    return None


@router.post("", summary="股票知识问答")
async def chat(req: ChatRequest):
    """接收对话消息，返回 AI 回答。

    如果配置了 LLM API key，调用大模型回答；
    否则使用内置知识库回答常见问题。
    """
    api_key = os.environ.get("LLM_API_KEY", "")
    api_url = os.environ.get("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    # 构建消息
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    # 尝试调用 LLM
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    api_url,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={"model": model, "messages": messages, "temperature": 0.7, "max_tokens": 2000},
                )
                data = resp.json()
                reply = data["choices"][0]["message"]["content"]
                return {"reply": reply, "source": "ai"}
        except Exception as e:
            pass  # fallback 到内置回答

    # 使用内置回答
    last_msg = req.messages[-1].content if req.messages else ""
    fallback = _find_fallback(last_msg)
    if fallback:
        return {"reply": fallback, "source": "knowledge_base"}

    return {
        "reply": f"""你好！我是 Stock-AYUU 股票知识助手。

你可以问我以下问题：
- 📊 什么是 MACD？怎么用？
- 📈 如何看 K 线图？
- 💰 什么是市盈率？
- 🔍 如何选择好股票？
- 📉 布林带怎么用？
- 📋 K线有哪些常见形态？
- 🎯 有哪些选股策略？

如需 AI 深度分析，请在后台配置 LLM API Key。

⚠️ 以上内容仅供学习参考，不构成任何投资建议。""",
        "source": "knowledge_base",
    }
