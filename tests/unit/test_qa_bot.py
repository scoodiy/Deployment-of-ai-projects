import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'qa-bot'))

from bot.intent import IntentClassifier
from bot.reranker import Reranker
from bot.guard import OutputGuard

class TestIntentClassifier:
    def test_market_intent(self):
        classifier = IntentClassifier()
        intent, conf = classifier.classify("BTC今天价格多少")
        assert intent == "market_data"
        assert conf > 0
    
    def test_strategy_intent(self):
        classifier = IntentClassifier()
        intent, conf = classifier.classify("什么是网格策略")
        assert intent == "strategy_help"
    
    def test_risk_intent(self):
        classifier = IntentClassifier()
        intent, conf = classifier.classify("如何控制风险")
        assert intent == "risk_question"
    
    def test_general_intent(self):
        classifier = IntentClassifier()
        intent, conf = classifier.classify("你好")
        assert intent == "general"

class TestReranker:
    def test_rerank(self):
        reranker = Reranker()
        docs = [{"content": "网格交易策略详解"}, {"content": "风险控制方法"}, {"content": "今日行情分析"}]
        result = reranker.rerank("网格策略", docs)
        assert len(result) == 3

class TestOutputGuard:
    def test_safe_content(self):
        guard = OutputGuard()
        is_safe, msg = guard.check("这是一个正常的回答")
        assert is_safe
    
    def test_harmful_content(self):
        guard = OutputGuard()
        is_safe, msg = guard.check("这个策略保证收益")
        assert not is_safe
