class TextChunker:
    """Splits text into chunks for indexing."""
    
    def chunk(self, text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        if len(text) <= chunk_size:
            return [text]
        
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += ("\n\n" + para) if current_chunk else para
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                if len(para) > chunk_size:
                    sentences = para.replace("。", "。\n").replace(".", ".\n").split("\n")
                    sub_chunk = ""
                    for sent in sentences:
                        if len(sub_chunk) + len(sent) <= chunk_size:
                            sub_chunk += sent
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk.strip())
                            sub_chunk = sent
                    if sub_chunk:
                        current_chunk = sub_chunk
                    else:
                        current_chunk = ""
                else:
                    current_chunk = para
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Add overlap
        if overlap > 0 and len(chunks) > 1:
            overlapped = [chunks[0]]
            for i in range(1, len(chunks)):
                prev_tail = chunks[i-1][-overlap:] if len(chunks[i-1]) > overlap else chunks[i-1]
                overlapped.append(prev_tail + " " + chunks[i])
            chunks = overlapped
        
        return chunks
