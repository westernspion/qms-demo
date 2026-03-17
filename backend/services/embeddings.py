"""
services/embeddings.py — Ollama embedding + document chunking + pgvector storage.
"""

import json
import uuid
from typing import Any

import httpx
import asyncpg

from config import settings


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks using recursive separators."""
    chunk_size = settings.chunk_size
    overlap = settings.chunk_overlap
    separators = ["\n\n", "\n", ". ", " ", ""]

    def _split(t: str, seps: list[str]) -> list[str]:
        if not seps or len(t) <= chunk_size:
            return [t] if t.strip() else []
        sep = seps[0]
        if sep in t:
            parts = t.split(sep)
            chunks = []
            current = ""
            for part in parts:
                candidate = current + (sep if current else "") + part
                if len(candidate) <= chunk_size:
                    current = candidate
                else:
                    if current:
                        chunks.append(current)
                    if len(part) > chunk_size:
                        chunks.extend(_split(part, seps[1:]))
                        current = ""
                    else:
                        current = part
            if current:
                chunks.append(current)
            return chunks
        return _split(t, seps[1:])

    raw_chunks = _split(text, separators)

    # Apply overlap: prefix each chunk with the tail of the previous one
    if overlap <= 0 or len(raw_chunks) <= 1:
        return [c for c in raw_chunks if c.strip()]

    result = [raw_chunks[0]]
    for i in range(1, len(raw_chunks)):
        prev_tail = (
            raw_chunks[i - 1][-overlap:]
            if len(raw_chunks[i - 1]) > overlap
            else raw_chunks[i - 1]
        )
        result.append(prev_tail + raw_chunks[i])
    return [c for c in result if c.strip()]


async def embed_text(text: str) -> list[float]:
    """Get embedding vector from Ollama for a single text."""
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{settings.ollama_host}/api/embeddings",
            json={"model": settings.embed_model, "prompt": text},
        )
        r.raise_for_status()
        return r.json()["embedding"]


async def embed_and_store(
    pool: asyncpg.Pool,
    document_id: uuid.UUID,
    text: str,
    extra_metadata: dict[str, Any] | None = None,
) -> int:
    """Chunk text, embed each chunk, store in document_chunks. Returns chunk count."""
    chunks = chunk_text(text)
    if not chunks:
        return 0

    async with pool.acquire() as conn:
        # Delete any existing chunks for this document (re-embed idempotency)
        await conn.execute(
            "DELETE FROM document_chunks WHERE document_id = $1", document_id
        )

        for i, chunk in enumerate(chunks):
            vector = await embed_text(chunk)
            token_count = len(chunk.split())
            meta = dict(extra_metadata or {})
            meta["chunk_index"] = i

            # pgvector expects '[f1,f2,...]' string format
            vec_str = "[" + ",".join(str(v) for v in vector) + "]"

            await conn.execute(
                """
                INSERT INTO document_chunks
                  (document_id, chunk_index, content, embedding, token_count, metadata)
                VALUES ($1, $2, $3, $4::vector, $5, $6)
                """,
                document_id,
                i,
                chunk,
                vec_str,
                token_count,
                json.dumps(meta),
            )

    return len(chunks)
