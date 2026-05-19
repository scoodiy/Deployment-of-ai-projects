from ..bot.router import QueryRouter
from ..bot.query_rewriter import QueryRewriter
from ..bot.retriever import DocumentRetriever
from ..bot.reranker import Reranker
from ..bot.generator import AnswerGenerator
from ..bot.guard import OutputGuard
from ..knowledge.loader import KnowledgeLoader
from ..knowledge.chunker import TextChunker
from ..knowledge.embedder import TextEmbedder
from ..knowledge.indexer import KnowledgeIndexer
import numpy as np

class RAGPipeline:
    """Main RAG orchestrator."""
    
    def __init__(self):
        self.router = QueryRouter()
        self.rewriter = QueryRewriter()
        self.retriever = DocumentRetriever()
        self.reranker = Reranker()
        self.generator = AnswerGenerator()
        self.guard = OutputGuard()
        self.loader = KnowledgeLoader()
        self.chunker = TextChunker()
        self.embedder = TextEmbedder()
        self.indexer = KnowledgeIndexer()
        self._initialized = False
    
    async def initialize(self):
        """Load and index knowledge base."""
        docs = self.loader.load_documents(str(self.loader.__class__.__module__).replace(".", "/"))
        if not docs:
            # Use built-in knowledge
            docs = self._get_builtin_knowledge()
        
        all_chunks = []
        for doc in docs:
            chunks = self.chunker.chunk(doc["content"])
            for chunk in chunks:
                all_chunks.append({"content": chunk, "source": doc.get("source", "builtin")})
        
        if all_chunks:
            texts = [c["content"] for c in all_chunks]
            self.embedder.fit(texts)
            embeddings = self.embedder.embed_batch(texts)
            self.indexer.index_documents(all_chunks, embeddings)
            self.retriever.index(all_chunks, np.array(embeddings))
        
        self._initialized = True
    
    async def ask(self, question: str, history: list[dict] = None) -> dict:
        """Full RAG pipeline: classify → rewrite → retrieve → rerank → generate → guard."""
        if not self._initialized:
            await self.initialize()
        
        # 1. Classify intent
        intent, confidence = self.router.classifier.classify(question)
        
        # 2. Rewrite query
        rewritten = self.rewriter.rewrite(question, history or [])
        
        # 3. Retrieve
        query_emb = self.embedder.embed(rewritten)
        retrieved = self.indexer.search(query_emb, top_k=5)
        
        # 4. Rerank
        reranked = self.reranker.rerank(rewritten, retrieved)
        
        # 5. Generate
        result = await self.generator.generate(question, reranked, history)
        result["intent"] = intent
        result["intent_confidence"] = confidence
        
        # 6. Guard
        is_safe, guarded = self.guard.check(result["answer"])
        if is_safe:
            result["answer"] = guarded
        
        return result
    
    async def add_knowledge(self, source: str):
        docs = self.loader.load_documents(source)
        all_chunks = []
        for doc in docs:
            chunks = self.chunker.chunk(doc["content"])
            for chunk in chunks:
                all_chunks.append({"content": chunk, "source": doc.get("source", source)})
        
        if all_chunks:
            texts = [c["content"] for c in all_chunks]
            self.embedder.fit(texts)
    
    def _get_builtin_knowledge(self) -> list[dict]:
        return [
            {"content": "网格交易策略：在设定的价格区间内，按固定间隔设置买入和卖出订单。当价格下跌到某个网格线时买入，上涨到另一个网格线时卖出。适合震荡市场。", "source": "builtin"},
            {"content": "马丁格尔策略：每次亏损后将下一次的投入翻倍，直到盈利为止。风险极高，可能导致巨额亏损。不建议新手使用。", "source": "builtin"},
            {"content": "趋势跟踪策略：使用移动平均线（如EMA）交叉来判断趋势方向。短期均线上穿长期均线时买入（金叉），下穿时卖出（死叉）。配合ATR设置止损。", "source": "builtin"},
            {"content": "风险管理原则：1）单笔交易风险不超过总资金的2%；2）设置止损限制单笔亏损；3）监控最大回撤不超过20%；4）连续亏损超过5次应暂停交易。", "source": "builtin"},
            {"content": "K线分析：阳线表示收盘价高于开盘价（上涨），阴线表示收盘价低于开盘价（下跌）。常用技术指标：RSI、MACD、布林带、成交量。", "source": "builtin"},
        ]
