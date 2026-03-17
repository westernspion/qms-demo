"""
routers/capas.py — CAPA CRUD + AI analysis trigger.
"""

import json
import uuid
from datetime import datetime, timezone

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query

from db import get_pool
from schemas import CAPACreate, CAPADetail, CAPASummary, CAPAAnalyzeResponse, CAPAUpdate
from services.capa_agent import analyze_capa
from services.audit_service import log_action
from config import settings

router = APIRouter()


def _row_to_dict(row) -> dict:
    d = dict(row)
    for field in ("corrective_actions", "preventive_actions"):
        if isinstance(d.get(field), str):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                d[field] = []
    return d


@router.get("/capas", response_model=list[CAPASummary])
async def list_capas(
    status: str | None = Query(None),
    priority: str | None = Query(None),
    pool: asyncpg.Pool = Depends(get_pool),
):
    query = "SELECT * FROM capas WHERE 1=1"
    params = []
    if status:
        # Support comma-separated status values
        statuses = [s.strip() for s in status.split(",")]
        placeholders = ",".join(f"${i + 1}" for i in range(len(statuses)))
        query += f" AND status IN ({placeholders})"
        params.extend(statuses)
    if priority:
        params.append(priority)
        query += f" AND priority = ${len(params)}"
    query += " ORDER BY created_at DESC"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    return [_row_to_dict(r) for r in rows]


@router.post("/capas", response_model=CAPASummary, status_code=201)
async def create_capa(
    capa: CAPACreate,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM capas WHERE capa_number = $1", capa.capa_number
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"CAPA {capa.capa_number} already exists",
            )

        row = await conn.fetchrow(
            """
            INSERT INTO capas
              (capa_number, title, priority, owner, department,
               source_ncr, description, opened_date, target_close)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
            """,
            capa.capa_number,
            capa.title,
            capa.priority,
            capa.owner,
            capa.department,
            capa.source_ncr,
            capa.description,
            capa.opened_date,
            capa.target_close,
        )

    await log_action(
        pool,
        user_name="Dr. Sarah Chen",
        user_role="Quality Director",
        action="UPDATE_STATUS",
        resource_type="capa",
        resource_id=row["id"],
        resource_name=capa.capa_number,
        ai_involved=False,
        details={"status": "Open", "action": "created"},
    )

    return _row_to_dict(row)


@router.get("/capas/{capa_id}", response_model=CAPADetail)
async def get_capa(
    capa_id: uuid.UUID,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM capas WHERE id = $1", capa_id)
        if not row:
            raise HTTPException(status_code=404, detail="CAPA not found")

        timeline_rows = await conn.fetch(
            """
            SELECT * FROM capa_timeline
            WHERE capa_id = $1
            ORDER BY sort_order, event_date
            """,
            capa_id,
        )

    d = _row_to_dict(row)
    d["timeline"] = [dict(t) for t in timeline_rows]
    return d


@router.patch("/capas/{capa_id}", response_model=CAPASummary)
async def update_capa(
    capa_id: uuid.UUID,
    update: CAPAUpdate,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM capas WHERE id = $1", capa_id)
        if not row:
            raise HTTPException(status_code=404, detail="CAPA not found")

        updates = []
        params = []
        if update.status is not None:
            params.append(update.status)
            updates.append(f"status = ${len(params)}")
        if update.phase is not None:
            params.append(update.phase)
            updates.append(f"phase = ${len(params)}")
        if update.corrective_actions is not None:
            params.append(json.dumps(update.corrective_actions))
            updates.append(f"corrective_actions = ${len(params)}")

        if updates:
            params.append(datetime.now(timezone.utc))
            updates.append(f"updated_at = ${len(params)}")
            params.append(capa_id)
            await conn.execute(
                f"UPDATE capas SET {', '.join(updates)} WHERE id = ${len(params)}",
                *params,
            )
        updated = await conn.fetchrow("SELECT * FROM capas WHERE id = $1", capa_id)

    await log_action(
        pool,
        user_name="James Rodriguez",
        user_role="Process Engineer",
        action="UPDATE_STATUS",
        resource_type="capa",
        resource_id=capa_id,
        resource_name=row["capa_number"],
        ai_involved=False,
        details={"changes": update.model_dump(exclude_none=True)},
    )

    return _row_to_dict(updated)


@router.post("/capas/{capa_id}/analyze", response_model=CAPAAnalyzeResponse)
async def analyze_capa_endpoint(
    capa_id: uuid.UUID,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT capa_number FROM capas WHERE id = $1", capa_id
        )
    if not row:
        raise HTTPException(status_code=404, detail="CAPA not found")

    result = await analyze_capa(pool, capa_id)

    await log_action(
        pool,
        user_name="AI System",
        user_role="AI",
        action="GENERATE_RCA",
        resource_type="capa",
        resource_id=capa_id,
        resource_name=row["capa_number"],
        ai_involved=True,
        ai_model=settings.llm_model,
        details={
            "risk_score": result.get("risk_score"),
            "risk_level": result.get("risk_level"),
        },
    )

    return {**result, "capa_id": capa_id}
