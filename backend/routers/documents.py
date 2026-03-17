"""
routers/documents.py — Document CRUD, upload, AI analyze endpoints.
"""

import json
import uuid
from datetime import datetime, timezone

import asyncpg
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from db import get_pool
from schemas import (
    DocumentDetail,
    DocumentSummary,
    DocumentUploadResponse,
    DocumentAnalyzeResponse,
)
from services.embeddings import embed_and_store
from services.document_intel import analyze_document
from services.audit_service import log_action
from config import settings

router = APIRouter()


def _row_to_summary(row) -> dict:
    d = dict(row)
    # Decode metadata JSONB if it's a string
    if isinstance(d.get("metadata"), str):
        try:
            d["metadata"] = json.loads(d["metadata"])
        except Exception:
            d["metadata"] = {}
    return d


@router.get("/documents", response_model=list[DocumentSummary])
async def list_documents(
    type: str | None = Query(None),
    status: str | None = Query(None),
    pool: asyncpg.Pool = Depends(get_pool),
):
    query = "SELECT * FROM documents WHERE 1=1"
    params = []
    if type:
        params.append(type)
        query += f" AND doc_type = ${len(params)}"
    if status:
        params.append(status)
        query += f" AND status = ${len(params)}"
    query += " ORDER BY created_at DESC"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)

    return [_row_to_summary(r) for r in rows]


@router.get("/documents/{doc_id}", response_model=DocumentDetail)
async def get_document(
    doc_id: uuid.UUID,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM documents WHERE id = $1", doc_id)
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        chunk_count = await conn.fetchval(
            "SELECT COUNT(*) FROM document_chunks WHERE document_id = $1", doc_id
        )

    d = _row_to_summary(row)
    d["chunk_count"] = int(chunk_count or 0)
    meta = d.get("metadata") or {}
    if isinstance(meta, str):
        try:
            meta = json.loads(meta)
        except Exception:
            meta = {}
    d["entities"] = meta.get("entities")
    return d


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_number: str = Form(...),
    title: str = Form(...),
    doc_type: str = Form(...),
    version: str = Form("1.0"),
    author: str = Form(None),
    department: str = Form(None),
    pool: asyncpg.Pool = Depends(get_pool),
):
    # Read file content
    content = await file.read()
    try:
        text = content.decode("utf-8", errors="replace")
    except Exception:
        text = content.decode("latin-1", errors="replace")

    # Insert document record
    async with pool.acquire() as conn:
        # Check for duplicate doc_number
        existing = await conn.fetchval(
            "SELECT id FROM documents WHERE doc_number = $1", doc_number
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Document {doc_number} already exists",
            )

        doc_id = await conn.fetchval(
            """
            INSERT INTO documents
              (doc_number, title, doc_type, version, author, department,
               raw_text, file_name, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Active')
            RETURNING id
            """,
            doc_number,
            title,
            doc_type,
            version,
            author,
            department,
            text,
            file.filename,
        )

    # Chunk + embed
    chunk_count = await embed_and_store(pool, doc_id, text)

    # Audit log
    await log_action(
        pool,
        user_name="Dr. Sarah Chen",
        user_role="Quality Director",
        action="UPLOAD",
        resource_type="document",
        resource_id=doc_id,
        resource_name=doc_number,
        ai_involved=True,
        ai_model=settings.embed_model,
        details={"chunk_count": chunk_count, "file_name": file.filename},
    )

    return DocumentUploadResponse(
        id=doc_id,
        doc_number=doc_number,
        chunk_count=chunk_count,
        status="embedded",
    )


@router.post("/documents/{doc_id}/analyze", response_model=DocumentAnalyzeResponse)
async def analyze_doc(
    doc_id: uuid.UUID,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT doc_number, raw_text FROM documents WHERE id = $1", doc_id
        )
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    text = row["raw_text"] or ""
    entities = await analyze_document(pool, doc_id, text)

    now = datetime.now(timezone.utc)
    # Persist entities to metadata
    async with pool.acquire() as conn:
        existing_meta = await conn.fetchval(
            "SELECT metadata FROM documents WHERE id = $1", doc_id
        )
        try:
            meta = (
                json.loads(existing_meta)
                if isinstance(existing_meta, str)
                else (existing_meta or {})
            )
        except Exception:
            meta = {}
        meta["entities"] = entities
        meta["analyzed_at"] = now.isoformat()

        await conn.execute(
            "UPDATE documents SET metadata = $1, updated_at = $2 WHERE id = $3",
            json.dumps(meta),
            now,
            doc_id,
        )

    await log_action(
        pool,
        user_name="AI System",
        user_role="AI",
        action="CLASSIFY",
        resource_type="document",
        resource_id=doc_id,
        resource_name=row["doc_number"],
        ai_involved=True,
        ai_model=settings.llm_model,
        details={"entities_extracted": len(entities.get("key_entities", []))},
    )

    return DocumentAnalyzeResponse(
        document_id=doc_id,
        entities=entities,
        analyzed_at=now,
    )
