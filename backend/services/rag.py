"""
services/rag.py — RAG pipeline: embed query → similarity search → LLM → SSE stream.
"""

import json
import time
import uuid
from typing import AsyncGenerator

import httpx
import asyncpg

from config import settings
from services.embeddings import embed_text


SYSTEM_PROMPT = """You are an expert Quality Management System assistant for Apex Glass Technologies,
a specialty glass and optical fiber manufacturer.

Answer questions using ONLY the context documents provided below.
Be specific — cite document numbers, version numbers, dates, and parameter values
when they appear in the context.
If the context does not contain enough information to answer fully, say so clearly.
Do not invent regulatory citations or specifications not present in the context.

Format your response with markdown: use **bold** for document IDs, parameter values,
and key findings. Use bullet lists for multiple items.

Context documents:
{context}"""


async def similarity_search(
    pool: asyncpg.Pool,
    query_vector: list[float],
    top_k: int = 5,
) -> list[dict]:
    """Find top-k chunks by cosine similarity to query_vector."""
    vec_str = "[" + ",".join(str(v) for v in query_vector) + "]"

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                dc.id,
                dc.content,
                dc.document_id,
                1 - (dc.embedding <=> $1::vector) AS score,
                d.doc_number,
                d.title
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            ORDER BY dc.embedding <=> $1::vector
            LIMIT $2
            """,
            vec_str,
            top_k,
        )
    return [dict(r) for r in rows]


async def rag_stream(
    pool: asyncpg.Pool,
    query: str,
) -> AsyncGenerator[str, None]:
    """
    Full RAG pipeline yielding SSE-formatted data lines.
    Events: status, sources, token, done
    """
    start = time.time()

    # 1. Embed query
    yield _sse({"type": "status", "message": "Embedding query..."})
    query_vector = await embed_text(query)

    # Count total chunks for status message
    async with pool.acquire() as conn:
        chunk_count = await conn.fetchval("SELECT COUNT(*) FROM document_chunks") or 0

    yield _sse({"type": "status", "message": f"Searching {chunk_count} chunks..."})

    # 2. Retrieve
    results = await similarity_search(pool, query_vector, top_k=settings.top_k_chunks)

    sources = [
        {
            "doc_id": str(r["document_id"]),
            "doc_number": r["doc_number"],
            "title": r["title"],
            "relevance": round(float(r["score"]), 4),
            "snippet": r["content"][:300].replace("\n", " "),
        }
        for r in results
        if float(r["score"]) > 0.0
    ]

    yield _sse({"type": "sources", "sources": sources})
    yield _sse(
        {
            "type": "status",
            "message": f"Reading {len(sources)} relevant sources… synthesizing answer",
        }
    )

    # 3. Build prompt context
    context_parts = []
    for i, r in enumerate(results):
        context_parts.append(
            f"[{i + 1}] {r['doc_number']} — {r['title']}\n{r['content']}"
        )
    context = "\n\n---\n\n".join(context_parts)
    system = SYSTEM_PROMPT.format(context=context)

    # 4. Stream LLM response
    full_response = ""
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{settings.ollama_host}/api/generate",
            json={
                "model": settings.llm_model,
                "prompt": f"{system}\n\nUser question: {query}",
                "stream": True,
            },
        ) as resp:
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    token = data.get("response", "")
                    if token:
                        full_response += token
                        yield _sse({"type": "token", "content": token})
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue

    elapsed = int((time.time() - start) * 1000)
    yield _sse({"type": "done", "sources": sources, "elapsed_ms": elapsed})


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
