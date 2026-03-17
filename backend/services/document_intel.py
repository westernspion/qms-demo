"""
services/document_intel.py — AI entity extraction and classification for documents.
Uses Ollama LLM to extract entities, regulatory refs, key params, tags, related docs.
"""

import json
import re

import httpx
import asyncpg

from config import settings
from services.embeddings import embed_text


ENTITY_PROMPT = """You are a document analysis AI for Apex Glass Technologies QMS.
Analyze the following document and return a JSON object with this exact structure:

{{
  "document_type": {{"label": "...", "confidence": 0.0}},
  "regulatory_refs": [
    {{"standard": "...", "sections": ["..."], "confidence": 0.0}}
  ],
  "key_entities": [
    {{"entity": "...", "value": "...", "type": "..."}}
  ],
  "action_items": ["..."],
  "suggested_tags": ["..."],
  "related_docs": ["DOC-NUMBER-1", "DOC-NUMBER-2"]
}}

Document to analyze:
{document_text}

Return ONLY valid JSON. No markdown, no explanation."""


async def analyze_document(
    pool: asyncpg.Pool,
    document_id,
    text: str,
) -> dict:
    """Extract entities from document text using LLM."""
    # Truncate to keep context manageable
    truncated = text[:6000] if len(text) > 6000 else text

    prompt = ENTITY_PROMPT.format(document_text=truncated)

    result_text = ""
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            f"{settings.ollama_host}/api/generate",
            json={
                "model": settings.llm_model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
        )
        r.raise_for_status()
        result_text = r.json().get("response", "{}")

    # Parse JSON — be tolerant
    entities = {}
    try:
        # Strip any markdown fences if present
        clean = re.sub(r"```json?\s*|\s*```", "", result_text).strip()
        entities = json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        entities = {
            "document_type": {"label": "Unknown", "confidence": 0.5},
            "regulatory_refs": [],
            "key_entities": [],
            "action_items": [],
            "suggested_tags": [],
            "related_docs": [],
        }

    # Find semantically related documents via embedding similarity
    try:
        query_vec = await embed_text(truncated[:500])
        related = await _find_related_docs(pool, document_id, query_vec)
        if related and not entities.get("related_docs"):
            entities["related_docs"] = related
    except Exception:
        pass

    return entities


async def _find_related_docs(
    pool: asyncpg.Pool,
    exclude_doc_id,
    query_vector: list[float],
    top_k: int = 3,
) -> list[str]:
    """Find related document numbers via vector similarity, excluding self."""
    vec_str = "[" + ",".join(str(v) for v in query_vector) + "]"
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT d.doc_number
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE d.id != $2
            ORDER BY dc.embedding <=> $1::vector
            LIMIT $3
            """,
            vec_str,
            exclude_doc_id,
            top_k,
        )
    return [r["doc_number"] for r in rows]
