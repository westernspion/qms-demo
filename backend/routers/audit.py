"""
routers/audit.py — GET /api/audit — audit log retrieval.
"""

import json
import asyncpg
from fastapi import APIRouter, Depends, Query

from db import get_pool
from schemas import AuditEntry

router = APIRouter()


def _parse_row(row) -> dict:
    d = dict(row)
    # asyncpg returns JSONB as string — parse it
    if isinstance(d.get("details"), str):
        try:
            d["details"] = json.loads(d["details"])
        except Exception:
            d["details"] = {}
    elif d.get("details") is None:
        d["details"] = {}
    return d


@router.get("/audit", response_model=list[AuditEntry])
async def get_audit(
    limit: int = Query(50, ge=1, le=500),
    action: str | None = Query(None),
    ai_only: bool | None = Query(None),
    resource_type: str | None = Query(None),
    pool: asyncpg.Pool = Depends(get_pool),
):
    query = "SELECT * FROM audit_log WHERE 1=1"
    params = []

    if action:
        params.append(action)
        query += f" AND action = ${len(params)}"
    if ai_only is True:
        query += " AND ai_involved = true"
    elif ai_only is False:
        query += " AND ai_involved = false"
    if resource_type:
        params.append(resource_type)
        query += f" AND resource_type = ${len(params)}"

    query += " ORDER BY timestamp DESC"
    params.append(limit)
    query += f" LIMIT ${len(params)}"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    return [_parse_row(r) for r in rows]
