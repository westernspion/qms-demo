"""
routers/health.py — GET /api/health
Returns service status, DB connectivity, Ollama availability, and data counts.
"""

import httpx
from fastapi import APIRouter, Depends
from asyncpg import Pool

from db import get_pool
from schemas import HealthResponse
from config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(pool: Pool = Depends(get_pool)):
    # DB check
    db_status = "disconnected"
    doc_count = 0
    capa_count = 0
    chunk_count = 0
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
            doc_count = await conn.fetchval("SELECT COUNT(*) FROM documents") or 0
            capa_count = await conn.fetchval("SELECT COUNT(*) FROM capas") or 0
            chunk_count = (
                await conn.fetchval("SELECT COUNT(*) FROM document_chunks") or 0
            )
        db_status = "connected"
    except Exception:
        pass

    # Ollama check
    ollama_status = "unavailable"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.ollama_host}/api/tags")
            if r.status_code == 200:
                ollama_status = "ready"
    except Exception:
        pass

    return HealthResponse(
        status="ok",
        db=db_status,
        ollama=ollama_status,
        embed_model=settings.embed_model,
        llm_model=settings.llm_model,
        document_count=int(doc_count),
        capa_count=int(capa_count),
        chunk_count=int(chunk_count),
    )
