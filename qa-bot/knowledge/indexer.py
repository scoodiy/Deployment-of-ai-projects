import numpy as np
from typing import Any

class KnowledgeIndexer:
    """Indexes and searches documents using embeddings."""
    
    def __init__(self):
        self._documents: list[dict] = []
        self._embeddings: np.ndarray | None = None
    
    def index_documents(self, documents: list[dict], embeddings: list[list[float]]):
        self._documents = documents
        self._embeddings = np.array(embeddings) if embeddings else None
    
    def search(self, query_embedding: list[float], top_k: int = 5) -> list[dict]:
        if self._embeddings is None or len(self._documents) == 0:
            return []
        
        q = np.array(query_embedding)
        similarities = self._cosine_similarity(q, self._embeddings)
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.05:
                doc = self._documents[idx].copy()
                doc["score"] = float(similarities[idx])
                results.append(doc)
        return results
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> np.ndarray:
        a_norm = a / (np.linalg.norm(a) + 1e-10)
        b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-10)
        return np.dot(b_norm, a_norm)
