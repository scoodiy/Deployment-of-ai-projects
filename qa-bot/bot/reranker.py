import math
from collections import Counter

class Reranker:
    """Reranks documents using BM25-style scoring."""
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
    
    def rerank(self, query: str, documents: list[dict]) -> list[dict]:
        if not documents:
            return []
        
        query_terms = query.lower().split()
        doc_texts = [d.get("content", "").lower() for d in documents]
        avg_dl = sum(len(t.split()) for t in doc_texts) / len(doc_texts) if doc_texts else 1
        
        scores = []
        for i, doc_text in enumerate(doc_texts):
            score = 0.0
            terms = doc_text.split()
            dl = len(terms)
            tf_counter = Counter(terms)
            
            for qt in query_terms:
                tf = tf_counter.get(qt, 0)
                if tf > 0:
                    idf = math.log((len(doc_texts) + 1) / (sum(1 for t in doc_texts if qt in t) + 1))
                    tf_norm = (tf * (self.k1 + 1)) / (tf + self.k1 * (1 - self.b + self.b * dl / avg_dl))
                    score += idf * tf_norm
            
            doc = documents[i].copy()
            doc["rerank_score"] = score
            scores.append(doc)
        
        return sorted(scores, key=lambda x: x.get("rerank_score", 0), reverse=True)
