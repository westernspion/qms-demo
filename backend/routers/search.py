"""
routers/search.py — POST /api/search — SSE RAG pipeline.
"""

import asyncpg
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from db import get_pool
from schemas import SearchRequest
from services.rag import rag_stream
from services.audit_service import log_action
from config import settings

router = APIRouter()


@router.post("/search")
async def search(
    req: SearchRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async def event_stream():
        sources_seen = []
        async for chunk in rag_stream(pool, req.query):
            yield chunk
            # Extract sources from the stream to log them
            import json

            try:
                data = json.loads(chunk.removeprefix("data: ").strip())
                if data.get("type") == "sources":
                    sources_seen[:] = data.get("sources", [])
                elif data.get("type") == "done":
                    # Log after stream completes — fire and forget
                    import asyncio

                    asyncio.create_task(
                        log_action(
                            pool,
                            user_name="Dr. Sarah Chen",
                            user_role="Quality Director",
                            action="SEARCH",
                            resource_type="search",
                            resource_name="RAG Query",
                            ai_involved=True,
                            ai_model=settings.llm_model,
                            details={
                                "query": req.query[:200],
                                "source_count": len(sources_seen),
                                "elapsed_ms": data.get("elapsed_ms"),
                            },
                        )
                    )
            except Exception:
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
