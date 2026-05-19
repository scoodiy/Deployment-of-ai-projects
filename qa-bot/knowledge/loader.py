import os
import json
from pathlib import Path

class KnowledgeLoader:
    """Loads documents from various sources."""
    
    def load_documents(self, source_dir: str) -> list[dict]:
        docs = []
        source_path = Path(source_dir)
        if not source_path.exists():
            return docs
        
        for file_path in source_path.rglob("*"):
            if file_path.suffix in [".md", ".txt"]:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                docs.append({"content": content, "source": str(file_path), "type": file_path.suffix})
            elif file_path.suffix == ".json":
                try:
                    data = json.loads(file_path.read_text(encoding="utf-8"))
                    if isinstance(data, list):
                        for item in data:
                            docs.append({"content": json.dumps(item, ensure_ascii=False), "source": str(file_path), "type": "json"})
                    else:
                        docs.append({"content": json.dumps(data, ensure_ascii=False), "source": str(file_path), "type": "json"})
                except Exception:
                    pass
        return docs
    
    async def load_from_url(self, url: str) -> dict:
        return {"content": f"Content from {url}", "source": url, "type": "web"}
