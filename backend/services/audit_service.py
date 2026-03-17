"""
services/audit_service.py — Write entries to the audit_log table.
Every AI action is logged here — non-negotiable per AGENTS.md.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import asyncpg


async def log_action(
    pool: asyncpg.Pool,
    *,
    user_name: str,
    action: str,
    resource_type: str | None = None,
    resource_id: uuid.UUID | None = None,
    resource_name: str | None = None,
    ai_involved: bool = False,
    ai_model: str | None = None,
    details: dict[str, Any] | None = None,
    user_role: str | None = None,
    ip_address: str = "internal",
) -> None:
    ts = datetime.now(timezone.utc)
    rid = str(resource_id) if resource_id else ""
    raw = f"{ts.isoformat()}|system|{action}|{rid}"
    signature = "sha256:" + hashlib.sha256(raw.encode()).hexdigest()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO audit_log
              (timestamp, user_id, user_name, user_role, action,
               resource_type, resource_id, resource_name,
               ai_involved, ai_model, details, ip_address, signature)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            """,
            ts,
            "system",
            user_name,
            user_role,
            action,
            resource_type,
            resource_id,
            resource_name,
            ai_involved,
            ai_model,
            json.dumps(details or {}),
            ip_address,
            signature,
        )
