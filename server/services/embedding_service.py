import json
import os
import math
import logging
from typing import Dict, Any, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter  # langchain >=0.3 splitters
except Exception:
    # Fallback for older langchain versions
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore


class EmbeddingService:
    """Lightweight embedding + retrieval stored on disk per user.

    - If OPENAI_API_KEY is set, uses OpenAIEmbeddings via langchain to embed chunks and queries.
    - Otherwise, falls back to simple keyword scoring over chunks.
    - Storage format: JSON list of {id, document_id, chunk_id, text, embedding?, metadata}
    """

    def __init__(self, base_dir: str = "vectorstore"):
        # Persist under server/vectorstore regardless of CWD
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", base_dir))
        self.base_dir = base
        os.makedirs(self.base_dir, exist_ok=True)

        self.embeddings = None
        if getattr(settings, "OPENAI_API_KEY", None):
            try:
                from langchain_openai import OpenAIEmbeddings  # type: ignore

                self.embeddings = OpenAIEmbeddings(
                    api_key=settings.OPENAI_API_KEY
                )
            except Exception as exc:
                logger.warning(f"Embeddings disabled: {exc}")
                self.embeddings = None

        # Default splitter
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=80,
            separators=["\n\n", "\n", ". ", ".", " "]
        )

    def _user_store_path(self, user_id: str) -> str:
        return os.path.join(self.base_dir, f"{user_id}.json")

    def _load_store(self, user_id: str) -> List[Dict[str, Any]]:
        path = self._user_store_path(user_id)
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.warning(f"Failed to load vector store for {user_id}: {exc}")
            return []

    def _save_store(self, user_id: str, data: List[Dict[str, Any]]):
        path = self._user_store_path(user_id)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info({"event": "vector_store_saved", "user_id": user_id, "path": path, "entries": len(data)})

    def index_document(self, user_id: str, document_id: str, filename: str, doc_type: Optional[str], text: str):
        if not text:
            # Ensure store exists even if OCR produced no text (e.g., tesseract missing)
            path = self._user_store_path(user_id)
            if not os.path.exists(path):
                self._save_store(user_id, [])
            logger.info(f"Skipping embedding index for {document_id}: empty text")
            return
        chunks = self.splitter.split_text(text)

        entries: List[Dict[str, Any]] = []
        if self.embeddings is not None:
            try:
                vectors = self.embeddings.embed_documents(chunks)
            except Exception as exc:
                logger.warning(f"Embedding failed, falling back to keyword-only: {exc}")
                vectors = [None] * len(chunks)
        else:
            vectors = [None] * len(chunks)

        for idx, chunk in enumerate(chunks):
            entry: Dict[str, Any] = {
                "id": f"{document_id}:{idx}",
                "document_id": document_id,
                "chunk_id": idx,
                "text": chunk,
                "metadata": {
                    "filename": filename,
                    "type": doc_type or "unknown",
                },
            }
            vec = vectors[idx]
            if vec is not None:
                entry["embedding"] = vec
            entries.append(entry)

        store = self._load_store(user_id)
        # Remove old chunks for this document, then append
        store = [e for e in store if e.get("document_id") != document_id]
        store.extend(entries)
        self._save_store(user_id, store)
        logger.info(f"Indexed {len(entries)} chunks for document {document_id}")

    def _cosine_sim(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(y * y for y in b))
        if na == 0 or nb == 0:
            return 0.0
        return dot / (na * nb)

    def _keyword_score(self, text: str, query: str) -> int:
        qtoks = set(query.lower().split())
        ttoks = set(text.lower().split())
        return len(qtoks.intersection(ttoks))

    def retrieve(self, user_id: str, query: str, document_ids: Optional[List[str]] = None, k: int = 5) -> List[Dict[str, Any]]:
        store = self._load_store(user_id)
        if document_ids:
            allowed = set(document_ids)
            store = [e for e in store if e.get("document_id") in allowed]

        if not store:
            return []

        scored: List[Dict[str, Any]] = []
        if self.embeddings is not None:
            try:
                qvec = self.embeddings.embed_query(query)
                for e in store:
                    vec = e.get("embedding")
                    score = self._cosine_sim(qvec, vec) if vec is not None else 0.0
                    scored.append({"entry": e, "score": score})
            except Exception as exc:
                logger.warning(f"Query embedding failed; using keyword scoring: {exc}")
                for e in store:
                    score = self._keyword_score(e.get("text", ""), query)
                    scored.append({"entry": e, "score": float(score)})
        else:
            for e in store:
                score = self._keyword_score(e.get("text", ""), query)
                scored.append({"entry": e, "score": float(score)})

        scored.sort(key=lambda x: x["score"], reverse=True)
        top = scored[:k]
        return [t["entry"] for t in top]


