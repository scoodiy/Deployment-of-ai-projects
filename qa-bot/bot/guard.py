class OutputGuard:
    """Validates and guards bot output."""
    
    DISCLAIMER = "\n\n⚠️ 免责声明：以上信息仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。"
    
    HARMFUL_PATTERNS = [
        "保证收益", "稳赚不赔", "内幕消息", "guaranteed profit",
        "100% return", "no risk",
    ]
    
    def check(self, answer: str) -> tuple[bool, str]:
        for pattern in self.HARMFUL_PATTERNS:
            if pattern.lower() in answer.lower():
                return (False, f"回答包含不当内容：'{pattern}'")
        
        if not answer.endswith(self.DISCLAIMER):
            if any(kw in answer for kw in ["投资", "买入", "卖出", "策略", "trade", "buy", "sell"]):
                answer += self.DISCLAIMER
        
        return (True, answer)
