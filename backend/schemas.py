"""
schemas.py — All Pydantic v2 request/response models.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    status: str
    db: str
    ollama: str
    embed_model: str
    llm_model: str
    document_count: int
    capa_count: int
    chunk_count: int


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------


class DocumentBase(BaseModel):
    doc_number: str
    title: str
    doc_type: str
    version: str = "1.0"
    author: str | None = None
    department: str | None = None


class DocumentCreate(DocumentBase):
    pass


class DocumentSummary(DocumentBase):
    id: uuid.UUID
    status: str
    regulatory_refs: list[str] | None = None
    ai_score: float | None = None
    last_review: date | None = None
    next_review: date | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentDetail(DocumentSummary):
    raw_text: str | None = None
    file_name: str | None = None
    chunk_count: int = 0
    metadata: dict[str, Any] = {}
    entities: dict[str, Any] | None = None


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    doc_number: str
    chunk_count: int
    status: str


class DocumentAnalyzeResponse(BaseModel):
    document_id: uuid.UUID
    entities: dict[str, Any]
    analyzed_at: datetime


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


class SearchSource(BaseModel):
    doc_id: uuid.UUID
    doc_number: str
    title: str
    relevance: float
    snippet: str


# ---------------------------------------------------------------------------
# CAPAs
# ---------------------------------------------------------------------------


class CAPACreate(BaseModel):
    capa_number: str
    title: str
    priority: str = "Medium"
    owner: str | None = None
    department: str | None = None
    source_ncr: str | None = None
    description: str
    opened_date: date | None = None
    target_close: date | None = None


class CAPAUpdate(BaseModel):
    status: str | None = None
    phase: str | None = None
    corrective_actions: list[dict[str, Any]] | None = None


class TimelineEvent(BaseModel):
    id: uuid.UUID
    event_date: date
    event: str
    status: str
    ai_involved: bool
    sort_order: int


class CAPASummary(BaseModel):
    id: uuid.UUID
    capa_number: str
    title: str
    status: str
    priority: str
    phase: str | None = None
    owner: str | None = None
    department: str | None = None
    source_ncr: str | None = None
    opened_date: date
    target_close: date | None = None
    ai_analyzed_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CAPADetail(CAPASummary):
    description: str
    root_cause: str | None = None
    root_cause_confidence: float | None = None
    corrective_actions: list[dict[str, Any]] | None = None
    corrective_confidence: float | None = None
    preventive_actions: list[dict[str, Any]] | None = None
    preventive_confidence: float | None = None
    risk_severity: str | None = None
    risk_likelihood: str | None = None
    risk_level: str | None = None
    risk_score: int | None = None
    risk_confidence: float | None = None
    customer_impact: str | None = None
    regulatory_impact: str | None = None
    timeline: list[TimelineEvent] = []


class CAPAAnalyzeResponse(BaseModel):
    capa_id: uuid.UUID
    root_cause: str
    root_cause_confidence: float
    root_cause_details: list[str] = []
    contributing_factors: list[str] = []
    corrective_actions: list[dict[str, Any]]
    corrective_confidence: float
    preventive_actions: list[dict[str, Any]]
    preventive_confidence: float
    risk_severity: str
    risk_likelihood: str
    risk_level: str
    risk_score: int
    risk_confidence: float
    customer_impact: str
    regulatory_impact: str
    analyzed_at: datetime


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------


class AuditEntry(BaseModel):
    id: uuid.UUID
    timestamp: datetime
    user_name: str
    user_role: str | None = None
    action: str
    resource_type: str | None = None
    resource_id: uuid.UUID | None = None
    resource_name: str | None = None
    ai_involved: bool
    ai_model: str | None = None
    details: dict[str, Any] = {}
    ip_address: str | None = None
    signature: str | None = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Graph
# ---------------------------------------------------------------------------


class GraphNode(BaseModel):
    node_key: str
    label: str
    node_type: str
    group_key: str
    size: int = 12
    metadata: dict[str, Any] = {}


class GraphEdge(BaseModel):
    source_key: str
    target_key: str
    relationship: str
    weight: float = 1.0
    ai_extracted: bool = False


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
