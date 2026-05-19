from .intent import IntentClassifier

class QueryRouter:
    """Routes queries to appropriate handlers based on intent."""
    
    def __init__(self):
        self.classifier = IntentClassifier()
    
    async def route(self, query: str) -> str:
        intent, confidence = self.classifier.classify(query)
        return intent
