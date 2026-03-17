"""
services/capa_agent.py — AI-powered CAPA analysis: RCA, actions, risk scoring.
Fetches related document chunks via similarity search, feeds them to LLM.
"""

import json
import re
import uuid
from datetime import datetime, timezone

import httpx
import asyncpg

from config import settings
from services.embeddings import embed_text


RCA_PROMPT = """You are a quality engineering AI for Apex Glass Technologies.

Perform a thorough Root Cause Analysis (RCA) for the following CAPA and return
a JSON object with this exact structure:

{{
  "root_cause": "...",
  "root_cause_confidence": 0.0,
  "root_cause_details": ["...", "..."],
  "contributing_factors": ["...", "..."],
  "corrective_actions": [
    {{"action": "...", "priority": "Immediate|High|Medium|Low", "owner": "...", "due_date": "YYYY-MM-DD", "status": "Pending"}}
  ],
  "corrective_confidence": 0.0,
  "preventive_actions": [
    {{"action": "...", "priority": "High|Medium|Low", "owner": "..."}}
  ],
  "preventive_confidence": 0.0,
  "risk_severity": "Critical|Moderate|Minor",
  "risk_likelihood": "Likely|Possible|Unlikely",
  "risk_level": "High|Medium|Low",
  "risk_score": 7,
  "risk_confidence": 0.0,
  "customer_impact": "...",
  "regulatory_impact": "..."
}}

CAPA Information:
Title: {title}
Description: {description}
Source NCR: {source_ncr}

Related Document Context:
{context}

Return ONLY valid JSON. No markdown, no explanation."""


async def analyze_capa(
    pool: asyncpg.Pool,
    capa_id: uuid.UUID,
) -> dict:
    """Run full AI analysis on a CAPA. Returns structured analysis dict."""
    # Fetch CAPA record
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM capas WHERE id = $1", capa_id)
    if not row:
        raise ValueError(f"CAPA {capa_id} not found")

    description = row["description"] or ""
    title = row["title"] or ""
    source_ncr = row["source_ncr"] or "N/A"

    # Find related document chunks via embedding similarity
    context = ""
    try:
        query_text = f"{title} {description}"
        query_vec = await embed_text(query_text[:1000])
        vec_str = "[" + ",".join(str(v) for v in query_vec) + "]"

        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT dc.content, d.doc_number, d.title
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                ORDER BY dc.embedding <=> $1::vector
                LIMIT 5
                """,
                vec_str,
            )
        parts = [f"[{r['doc_number']}] {r['title']}\n{r['content']}" for r in rows]
        context = "\n\n---\n\n".join(parts)
    except Exception:
        context = "No related documents found."

    prompt = RCA_PROMPT.format(
        title=title,
        description=description[:2000],
        source_ncr=source_ncr,
        context=context[:3000],
    )

    # Call LLM
    result_text = ""
    async with httpx.AsyncClient(timeout=180) as client:
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

    # Parse
    analysis = {}
    try:
        clean = re.sub(r"```json?\s*|\s*```", "", result_text).strip()
        analysis = json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        analysis = _fallback_analysis()

    # Persist to DB
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE capas SET
                root_cause = $1,
                root_cause_confidence = $2,
                corrective_actions = $3,
                corrective_confidence = $4,
                preventive_actions = $5,
                preventive_confidence = $6,
                risk_severity = $7,
                risk_likelihood = $8,
                risk_level = $9,
                risk_score = $10,
                risk_confidence = $11,
                customer_impact = $12,
                regulatory_impact = $13,
                ai_analyzed_at = $14,
                updated_at = $14
            WHERE id = $15
            """,
            analysis.get("root_cause", "Analysis pending"),
            analysis.get("root_cause_confidence", 0.5),
            json.dumps(analysis.get("corrective_actions", [])),
            analysis.get("corrective_confidence", 0.5),
            json.dumps(analysis.get("preventive_actions", [])),
            analysis.get("preventive_confidence", 0.5),
            analysis.get("risk_severity", "Moderate"),
            analysis.get("risk_likelihood", "Possible"),
            analysis.get("risk_level", "Medium"),
            int(analysis.get("risk_score", 5)),
            analysis.get("risk_confidence", 0.5),
            analysis.get("customer_impact", ""),
            analysis.get("regulatory_impact", ""),
            now,
            capa_id,
        )

    analysis["analyzed_at"] = now.isoformat()
    analysis["capa_id"] = str(capa_id)
    return analysis


def _fallback_analysis() -> dict:
    return {
        "root_cause": "Analysis could not be completed — LLM response was malformed.",
        "root_cause_confidence": 0.3,
        "root_cause_details": [],
        "contributing_factors": [],
        "corrective_actions": [
            {
                "action": "Manual root cause analysis required",
                "priority": "High",
                "owner": "Quality Team",
                "due_date": "2025-01-31",
                "status": "Pending",
            }
        ],
        "corrective_confidence": 0.3,
        "preventive_actions": [],
        "preventive_confidence": 0.3,
        "risk_severity": "Moderate",
        "risk_likelihood": "Possible",
        "risk_level": "Medium",
        "risk_score": 5,
        "risk_confidence": 0.3,
        "customer_impact": "Under review",
        "regulatory_impact": "Under review",
    }
