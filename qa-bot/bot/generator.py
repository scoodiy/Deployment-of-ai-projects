from typing import Any

class AnswerGenerator:
    """Generates answers from context using templates."""
    
    TEMPLATES = {
        "market_data": "根据最新数据，{symbol} 当前价格为 {price}。{context}",
        "strategy_help": "关于您的策略问题：{answer}。参考资料：{sources}",
        "risk_question": "风险分析：{answer}。请注意，以上仅供参考，不构成投资建议。",
        "portfolio_question": "您的持仓情况：{answer}",
        "general": "关于「{question}」：{answer}",
    }
    
    async def generate(self, query: str, context: list[dict] = None, history: list[dict] = None) -> dict:
        context = context or []
        
        if not context:
            return {
                "answer": f"抱歉，我没有找到关于「{query}」的相关信息。请尝试换个方式提问，或查看我们的知识库。",
                "sources": [],
                "confidence": 0.2,
            }
        
        # Build answer from context
        context_texts = [c.get("content", "") for c in context[:3]]
        sources = [c.get("source", "") for c in context[:3] if c.get("source")]
        
        answer = " ".join(context_texts)
        if len(answer) > 500:
            answer = answer[:500] + "..."
        
        confidence = min(sum(c.get("score", 0.5) for c in context[:3]) / 3, 1.0)
        
        return {
            "answer": answer,
            "sources": sources,
            "confidence": round(confidence, 2),
        }
