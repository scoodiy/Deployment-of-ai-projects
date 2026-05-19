class QueryRewriter:
    """Rewrites queries using conversation context."""
    
    def rewrite(self, query: str, context: list[dict] = None) -> str:
        if not context:
            return query
        
        last_exchange = context[-1] if context else {}
        last_answer = last_exchange.get("answer", "")
        
        # Simple pronoun resolution
        if query.startswith(("它", "这个", "那个", "it", "that")):
            if last_answer:
                keywords = last_answer[:50]
                return f"{keywords} {query}"
        
        return query
