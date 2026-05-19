import numpy as np
from typing import Any
import re
from collections import Counter

class TextEmbedder:
    """Lightweight text embedder using TF-IDF + SVD."""
    
    def __init__(self, dim: int = 64):
        self.dim = dim
        self._vocab: dict[str, int] = {}
        self._idf: np.ndarray | None = None
        self._svd_components: np.ndarray | None = None
        self._fitted = False
    
    def _tokenize(self, text: str) -> list[str]:
        text = text.lower()
        tokens = re.findall(r'[\w一-鿿]+', text)
        return tokens
    
    def fit(self, texts: list[str]):
        tokenized = [self._tokenize(t) for t in texts]
        
        # Build vocabulary
        all_tokens = set()
        for tokens in tokenized:
            all_tokens.update(tokens)
        self._vocab = {t: i for i, t in enumerate(sorted(all_tokens))}
        
        if not self._vocab:
            return
        
        # Build TF-IDF matrix
        n_docs = len(texts)
        n_terms = len(self._vocab)
        tfidf = np.zeros((n_docs, n_terms))
        
        df = np.zeros(n_terms)
        for tokens in tokenized:
            seen = set()
            for t in tokens:
                if t in self._vocab:
                    seen.add(self._vocab[t])
            for idx in seen:
                df[idx] += 1
        
        idf = np.log((n_docs + 1) / (df + 1)) + 1
        self._idf = idf
        
        for i, tokens in enumerate(tokenized):
            tf = Counter(tokens)
            for t, count in tf.items():
                if t in self._vocab:
                    j = self._vocab[t]
                    tfidf[i, j] = (count / len(tokens)) * idf[j]
        
        # SVD for dimensionality reduction
        k = min(self.dim, min(tfidf.shape) - 1)
        if k > 0:
            try:
                U, S, Vt = np.linalg.svd(tfidf, full_matrices=False)
                self._svd_components = Vt[:k]
            except Exception:
                self._svd_components = np.eye(k, n_terms)
        
        self._fitted = True
    
    def embed(self, text: str) -> list[float]:
        if not self._fitted or not self._vocab:
            return [0.0] * self.dim
        
        tokens = self._tokenize(text)
        tf = Counter(tokens)
        vec = np.zeros(len(self._vocab))
        
        for t, count in tf.items():
            if t in self._vocab:
                j = self._vocab[t]
                vec[j] = (count / len(tokens)) * self._idf[j]
        
        if self._svd_components is not None:
            result = self._svd_components @ vec
            if len(result) < self.dim:
                result = np.pad(result, (0, self.dim - len(result)))
            return result[:self.dim].tolist()
        
        return vec[:self.dim].tolist() if len(vec) >= self.dim else vec.tolist() + [0.0] * (self.dim - len(vec))
    
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(t) for t in texts]
