# Apex Glass Technologies — AI-Native QMS
## SPEC.md — Authoritative Implementation Reference

**Last updated:** 2026-03-16
**Status:** Active — implementation in progress

---

## Vision

A real, working AI-native Quality Management System for a fictional specialty glass manufacturer ("Apex Glass Technologies — Specialty Materials Division"). Documents are uploaded, chunked, embedded, and stored. Users query in natural language and get answers synthesized from actual document content. CAPAs, NCRs, and audit trails are real database records persisted in PostgreSQL.

The visual layer from the original demo is **preserved exactly** — same glassmorphism, same purple/cyan glow palette, same animations, same layout. The backend replaces every piece of fake data with real data. An agent watching the screen cannot tell the difference in appearance; only the data source changes.

**Runs locally via `docker compose up`.** No cloud. No API keys. No npm. No build step.

**Company:** Apex Glass Technologies · Specialty Materials Division  
**Domain:** Specialty glass manufacturing — optical fiber, display glass, borosilicate batch processing  
**Personas in the system:** Dr. Sarah Chen (Quality Director), James Rodriguez (Process Engineer), Michael Torres (Supplier Quality Eng.), Dr. Li Wei (Senior Scientist), Rebecca Hoffman (Coating Specialist)

---

## Tech Stack

### Frontend
- `frontend/index.html` — SPA shell, identical in structure to current `index.html`
- **Tailwind CSS via CDN** — `https://cdn.tailwindcss.com`, no npm, no build
- **Vanilla JS ES modules** — `type="module"`, no TypeScript, no framework
- `frontend/css/custom.css` — **do not modify**. All glassmorphism, glow, animations live here
- `frontend/js/api.js` — the only file that knows `API_BASE_URL`. All `fetch()` calls go here
- `frontend/js/effects.js` — background particles + gradient mesh. **do not modify**
- D3.js via CDN for knowledge graph — already in use, no new CDN deps
- **Served by Nginx** inside Docker on port 80

### Backend
- **Python 3.11 / FastAPI** — async throughout, Pydantic v2 schemas
- **PostgreSQL 16 + pgvector extension** — all storage, all embeddings
- **Ollama** — Docker service, exposed at `http://ollama:11434`
  - Embedding model: `nomic-embed-text` — 768-dim, fast, small
  - Generation model: `qwen2.5:3b` — fits comfortably in available memory (use 7b on machines with 8GB+ available)
- **LangChain** — RAG pipeline only: document loading, text splitting, prompt templates, retrieval chain
- **asyncpg** — raw async DB driver, no heavy ORM. SQLAlchemy Core for schema only
- **Docker Compose** — single `docker compose up` spins up everything

### Forbidden
- No external API keys (OpenAI, Anthropic, Cohere — anything)
- No cloud vector stores (Pinecone, Weaviate, Chroma cloud, etc.)
- No npm, no build step, no TypeScript, no transpilation
- No SQLAlchemy ORM sessions/relationships — use raw asyncpg queries
- Do not touch `css/custom.css` — not a single line

---

## Repository Structure

```
rag-qms-demo/
├── docker-compose.yml
├── .env.example
├── .env                          # gitignored
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                   # FastAPI app, CORS, router registration, lifespan
│   ├── config.py                 # Pydantic Settings — reads from env
│   ├── db.py                     # asyncpg pool init, pgvector setup, table creation
│   ├── schemas.py                # All Pydantic v2 request/response models
│   │
│   ├── routers/
│   │   ├── health.py             # GET /api/health
│   │   ├── documents.py          # GET/POST /api/documents, GET /api/documents/{id}
│   │   ├── search.py             # POST /api/search (SSE stream)
│   │   ├── capas.py              # CRUD + POST /api/capas/{id}/analyze
│   │   ├── audit.py              # GET /api/audit
│   │   └── graph.py              # GET /api/graph
│   │
│   ├── services/
│   │   ├── embeddings.py         # Ollama embed, chunk + store to pgvector
│   │   ├── rag.py                # Query embed → similarity search → LLM → SSE
│   │   ├── document_intel.py     # Entity extraction, classification, cross-refs
│   │   ├── capa_agent.py         # RCA generation, action planning, risk score
│   │   └── graph_builder.py      # Node/edge extraction from documents + CAPAs
│   │
│   └── seed/
│       ├── seed.py               # Idempotent: creates schema + loads docs if empty
│       └── docs/
│           ├── SOP-2024-031_fiber_draw_process_control.txt
│           ├── SOP-2024-028_glass_substrate_cleaning.txt
│           ├── SOP-2024-019_fusion_draw_calibration.txt
│           ├── WI-4420_borosilicate_batch_mixing.txt
│           ├── WI-4455_fiber_preform_deposition.txt
│           ├── WI-4398_antireflective_coating.txt
│           ├── CAPA-089_fiber_draw_tension_deviation.txt
│           ├── CAPA-087_substrate_thickness_variation.txt
│           ├── NCR-2024-156_refractive_index_batch7842.txt
│           ├── NCR-2024-141_surface_defect_gorilla_lot22b.txt
│           ├── AR-2024-Q3_internal_audit_fiber_division.txt
│           └── TR-2024-015_fdm_operator_training.txt
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── custom.css            # Sacred — do not touch
│   └── js/
│       ├── app.js                # SPA routing, nav, dashboard wiring
│       ├── api.js                # All fetch() lives here. API_BASE_URL = '/api'
│       ├── search.js             # RAG search: SSE consumer, typewriter, citations
│       ├── documents.js          # Document list, upload, AI analyze trigger
│       ├── workflow.js           # CAPA detail, AI analyze trigger, approve/modify
│       ├── audit.js              # Audit log table, filters
│       ├── graph.js              # D3 graph from real API data
│       └── effects.js            # Particles + gradient mesh — do not touch
│
├── nginx/
│   └── nginx.conf
│
├── backend/tests/
│   ├── conftest.py               # pytest fixtures: test DB, test client, seed data
│   ├── test_health.py
│   ├── test_documents.py
│   ├── test_search.py
│   ├── test_capas.py
│   ├── test_audit.py
│   └── test_graph.py
│
├── SPEC.md
└── AGENTS.md
```

---

## Environment Variables

```ini
# .env.example
DB_HOST=db
DB_PORT=5432
DB_NAME=qms
DB_USER=qms
DB_PASSWORD=qms

OLLAMA_HOST=http://ollama:11434
EMBED_MODEL=nomic-embed-text
LLM_MODEL=qwen2.5:7b

CHUNK_SIZE=512
CHUNK_OVERLAP=64
TOP_K_CHUNKS=5

FRONTEND_ORIGIN=http://localhost:80
```

---

## Database Schema

### Extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### `documents`
```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_number      TEXT UNIQUE NOT NULL,     -- 'SOP-2024-031', 'WI-4420', etc.
  title           TEXT NOT NULL,
  doc_type        TEXT NOT NULL,            -- 'SOP' | 'Work Instruction' | 'CAPA' | 'NCR' | 'Audit Report' | 'Training Record' | 'Risk Assessment'
  status          TEXT NOT NULL DEFAULT 'Active',  -- 'Active' | 'Under Review' | 'Archived' | 'Final' | 'Open' | 'Closed' | 'In Progress'
  version         TEXT NOT NULL DEFAULT '1.0',
  author          TEXT,
  department      TEXT,
  regulatory_refs TEXT[],                   -- ['ISO 9001:2015 §8.6', 'FDA 21 CFR 820.80']
  ai_score        FLOAT,                    -- overall AI quality/relevance score 0.0-1.0
  last_review     DATE,
  next_review     DATE,
  raw_text        TEXT,                     -- full document text, stored for re-embedding
  file_name       TEXT,                     -- original file name
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `document_chunks`
```sql
CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(768),               -- nomic-embed-text output dimension
  token_count   INT,
  metadata      JSONB DEFAULT '{}',        -- page, section, heading, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX ON document_chunks (document_id);
```

### `capas`
```sql
CREATE TABLE capas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capa_number     TEXT UNIQUE NOT NULL,    -- 'CAPA-089'
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Open',  -- 'Open' | 'In Progress' | 'Pending Review' | 'Closed'
  priority        TEXT NOT NULL DEFAULT 'Medium',-- 'Critical' | 'High' | 'Medium' | 'Low'
  phase           TEXT,                          -- 'Root Cause Analysis' | 'Corrective Action' | 'Verification' | 'Closure'
  owner           TEXT,
  department      TEXT,
  source_doc_id   UUID REFERENCES documents(id), -- the NCR or document that triggered this
  source_ncr      TEXT,                          -- NCR number as text for display
  description     TEXT NOT NULL,
  root_cause      TEXT,                          -- AI-generated, stored after analysis
  root_cause_confidence FLOAT,                   -- 0.0-1.0
  corrective_actions    JSONB,                   -- [{action, priority, owner, due_date, status}]
  corrective_confidence FLOAT,
  preventive_actions    JSONB,                   -- [{action, priority, owner}]
  preventive_confidence FLOAT,
  risk_severity   TEXT,                          -- 'Critical' | 'Moderate' | 'Minor'
  risk_likelihood TEXT,                          -- 'Likely' | 'Possible' | 'Unlikely'
  risk_level      TEXT,                          -- 'High' | 'Medium' | 'Low'
  risk_score      INT,                           -- 1-10 composite
  risk_confidence FLOAT,
  customer_impact TEXT,
  regulatory_impact TEXT,
  ai_analyzed_at  TIMESTAMPTZ,
  opened_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  target_close    DATE,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `capa_timeline`
```sql
CREATE TABLE capa_timeline (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capa_id      UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  event_date   DATE NOT NULL,
  event        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending', -- 'completed' | 'in_progress' | 'pending'
  ai_involved  BOOLEAN NOT NULL DEFAULT false,
  sort_order   INT NOT NULL DEFAULT 0
);
```

### `audit_log`
```sql
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id       TEXT NOT NULL DEFAULT 'system',
  user_name     TEXT NOT NULL,
  user_role     TEXT,
  action        TEXT NOT NULL,   -- 'VIEW' | 'UPLOAD' | 'SEARCH' | 'APPROVE' | 'GENERATE_RCA' | 'GENERATE_ANALYSIS' | 'CLASSIFY' | 'EMBED' | 'UPDATE_STATUS' | 'EXPORT'
  resource_type TEXT,            -- 'document' | 'capa' | 'search' | 'system'
  resource_id   UUID,
  resource_name TEXT,            -- human-readable: 'SOP-2024-031', 'CAPA-089'
  ai_involved   BOOLEAN NOT NULL DEFAULT false,
  ai_model      TEXT,            -- 'qwen2.5:7b' when AI was used
  details       JSONB DEFAULT '{}',
  ip_address    TEXT DEFAULT 'internal',
  signature     TEXT             -- SHA-256(timestamp||user_id||action||resource_id)
);

CREATE INDEX ON audit_log (timestamp DESC);
CREATE INDEX ON audit_log (resource_id);
CREATE INDEX ON audit_log (ai_involved);
```

### `graph_nodes`
```sql
CREATE TABLE graph_nodes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_key  TEXT UNIQUE NOT NULL,  -- 'SOP-2024-031', 'person:sarah', 'reg:iso9001'
  label     TEXT NOT NULL,
  node_type TEXT NOT NULL,  -- 'document' | 'person' | 'process' | 'regulation' | 'supplier' | 'capa' | 'ncr'
  group_key TEXT NOT NULL,  -- 'sop' | 'wi' | 'capa' | 'ncr' | 'person' | 'process' | 'regulation' | 'supplier'
  size      INT DEFAULT 12,
  metadata  JSONB DEFAULT '{}'
);
```

### `graph_edges`
```sql
CREATE TABLE graph_edges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_key   TEXT NOT NULL REFERENCES graph_nodes(node_key),
  target_key   TEXT NOT NULL REFERENCES graph_nodes(node_key),
  relationship TEXT NOT NULL,  -- 'controls' | 'instructs' | 'affects' | 'triggered' | 'references' | 'governs' | 'owns' | 'sourced' | 'AI: potential duplicate'
  weight       FLOAT DEFAULT 1.0,
  ai_extracted BOOLEAN DEFAULT false
);
```

---

## API Reference

### `GET /api/health`
Returns service status and model availability.

**Response:**
```json
{
  "status": "ok",
  "db": "connected",
  "ollama": "ready",
  "embed_model": "nomic-embed-text",
  "llm_model": "qwen2.5:7b",
  "document_count": 12,
  "capa_count": 3,
  "chunk_count": 284
}
```

---

### `GET /api/documents`
Returns all documents, ordered by `created_at DESC`.

**Query params:** `type` (filter by doc_type), `status` (filter by status)

**Response:**
```json
[
  {
    "id": "uuid",
    "doc_number": "SOP-2024-031",
    "title": "Optical Fiber Draw Process Control",
    "doc_type": "SOP",
    "status": "Active",
    "version": "4.2",
    "author": "Dr. Sarah Chen",
    "department": "Fiber Optics",
    "regulatory_refs": ["ISO 9001:2015 §8.6", "FDA 21 CFR 820.80"],
    "ai_score": 0.96,
    "last_review": "2024-11-15",
    "next_review": "2025-05-15",
    "created_at": "2024-11-15T10:00:00Z"
  }
]
```

---

### `POST /api/documents/upload`
Uploads a document, chunks it, embeds it, stores everything. Logs to audit_log.

**Request:** `multipart/form-data`
- `file` — text or PDF file
- `doc_number` — e.g. "SOP-2024-031"
- `title`
- `doc_type`
- `version`
- `author`
- `department`

**Response:**
```json
{
  "id": "uuid",
  "doc_number": "SOP-2024-031",
  "chunk_count": 23,
  "status": "embedded"
}
```

**Side effects:**
1. Text extracted from file
2. Split into chunks (CHUNK_SIZE=512 tokens, CHUNK_OVERLAP=64)
3. Each chunk embedded via Ollama `nomic-embed-text`
4. Chunks + embeddings stored in `document_chunks`
5. `audit_log` entry: action=UPLOAD, ai_involved=true, ai_model=nomic-embed-text

---

### `GET /api/documents/{id}`
Returns full document detail including extracted entities (if analyzed).

**Response adds:**
```json
{
  "...all document fields...",
  "chunk_count": 23,
  "entities": {
    "document_type": {"label": "Standard Operating Procedure", "confidence": 0.98},
    "regulatory_refs": [
      {"standard": "ISO 9001:2015", "sections": ["§7.5", "§8.5.1"], "confidence": 0.96}
    ],
    "key_entities": [
      {"entity": "Draw Temperature", "value": "2050°C ± 15°C", "type": "Process Parameter"}
    ],
    "action_items": ["Ensure SPC software is configured..."],
    "suggested_tags": ["Fiber Optics", "Process Control", "SPC"],
    "related_docs": ["WI-4455", "WI-4420", "CAPA-089"]
  }
}
```
Entities are populated when `POST /api/documents/{id}/analyze` has been called.

---

### `POST /api/documents/{id}/analyze`
Triggers AI entity extraction and classification on a document. Logs to audit_log.

**Response:**
```json
{
  "document_id": "uuid",
  "entities": { "...same shape as above..." },
  "analyzed_at": "2024-12-06T14:00:00Z"
}
```

**Side effects:**
1. LLM prompt: extract entities, regulatory refs, key params, action items, tags
2. Vector similarity search → find top-3 related docs by chunk embedding
3. Results stored in document `metadata` JSONB
4. `audit_log` entry: action=CLASSIFY, ai_involved=true, ai_model=qwen2.5:7b

---

### `POST /api/search`
RAG query: embed → retrieve → generate → stream. The core feature.

**Request:**
```json
{ "query": "What are our nonconformance trends for Silica Source in Q4?" }
```

**Response:** `text/event-stream` (SSE)

Stream format:
```
data: {"type": "status", "message": "Embedding query..."}
data: {"type": "status", "message": "Searching 284 chunks..."}
data: {"type": "sources", "sources": [...]}
data: {"type": "token", "content": "Based"}
data: {"type": "token", "content": " on"}
... (one token per event)
data: {"type": "done", "sources": [...], "elapsed_ms": 1243}
```

Sources shape:
```json
[
  {
    "doc_id": "uuid",
    "doc_number": "NCR-2024-156",
    "title": "Out-of-Spec Refractive Index — Batch 7842",
    "relevance": 0.94,
    "snippet": "Batch 7842 from Silica Source showed refractive index of 1.4589..."
  }
]
```

**Backend pipeline:**
1. Embed query with `nomic-embed-text`
2. `SELECT ... ORDER BY embedding <=> $1 LIMIT 5` (cosine distance)
3. Build LangChain prompt with system context + retrieved chunks
4. Stream `qwen2.5:7b` response token by token via Ollama `/api/generate`
5. `audit_log` entry: action=SEARCH, ai_involved=true, ai_model=qwen2.5:7b, details={query, source_count}

---

### `GET /api/capas`
Returns all CAPAs ordered by `created_at DESC`.

**Query params:** `status`, `priority`

**Response:** array of CAPA summary objects (no full RCA text — keep payload small)

---

### `POST /api/capas`
Creates a new CAPA record.

**Request:**
```json
{
  "capa_number": "CAPA-090",
  "title": "...",
  "priority": "High",
  "owner": "James Rodriguez",
  "department": "Fiber Optics",
  "source_ncr": "NCR-2024-156",
  "description": "...",
  "opened_date": "2024-12-06",
  "target_close": "2025-01-15"
}
```

---

### `GET /api/capas/{id}`
Returns full CAPA detail including timeline, AI-generated RCA, actions, risk assessment.

**Response includes all CAPA table fields plus:**
```json
{
  "timeline": [
    {
      "event_date": "2024-11-28",
      "event": "Tension excursion detected by SPC system",
      "status": "completed",
      "ai_involved": true
    }
  ]
}
```

---

### `POST /api/capas/{id}/analyze`
Triggers full AI analysis: RCA, corrective actions, preventive actions, risk score.

**Response:**
```json
{
  "capa_id": "uuid",
  "root_cause": "Temperature gradient instability in draw furnace heating zone 3...",
  "root_cause_confidence": 0.87,
  "root_cause_details": ["SPC data shows drift correlating with Zone 3 thermocouple..."],
  "contributing_factors": ["PM interval set at 12 months..."],
  "corrective_actions": [
    {"action": "Replace heating element...", "priority": "Immediate", "owner": "Maintenance", "status": "Pending"}
  ],
  "corrective_confidence": 0.91,
  "preventive_actions": [
    {"action": "Implement predictive maintenance...", "priority": "High", "owner": "Engineering"}
  ],
  "preventive_confidence": 0.84,
  "risk_severity": "Moderate",
  "risk_likelihood": "Likely (if uncorrected)",
  "risk_level": "High",
  "risk_score": 7,
  "risk_confidence": 0.89,
  "customer_impact": "Potential fiber attenuation increase...",
  "regulatory_impact": "ISO 9001 §8.5.1 process control requirements...",
  "analyzed_at": "2024-12-06T14:00:00Z"
}
```

**Backend pipeline:**
1. Fetch CAPA description + source NCR text
2. Embed CAPA description → retrieve top-5 related chunks from `document_chunks`
3. LLM prompt with structured output format (JSON mode or guided extraction)
4. Parse and store all fields back to `capas` table
5. `audit_log` entry: action=GENERATE_RCA, ai_involved=true, ai_model=qwen2.5:7b

---

### `GET /api/audit`
Returns audit log entries ordered by `timestamp DESC`.

**Query params:** `limit` (default 50), `action`, `ai_only` (bool), `resource_type`

**Response:**
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-12-06T14:23:01Z",
    "user_name": "Dr. Sarah Chen",
    "user_role": "Quality Director",
    "action": "APPROVE",
    "resource_type": "document",
    "resource_name": "SOP-2024-031 v4.2",
    "ai_involved": false,
    "ai_model": null,
    "ip_address": "10.0.42.15",
    "signature": "sha256:a3f9..."
  }
]
```

---

### `GET /api/graph`
Returns all graph nodes and edges for D3 rendering.

**Response:**
```json
{
  "nodes": [
    {"node_key": "SOP-2024-031", "label": "SOP-2024-031", "node_type": "document", "group_key": "sop", "size": 18}
  ],
  "edges": [
    {"source_key": "SOP-2024-031", "target_key": "fiber-draw", "relationship": "controls", "weight": 1.0}
  ]
}
```

---

## RAG Pipeline — Detailed

```
User types: "What are our nonconformance trends for Silica Source in Q4?"
                                │
                                ▼
              POST /api/search  {query: "..."}
                                │
                   ┌────────────┴─────────────┐
                   │  services/rag.py          │
                   │                           │
                   │  1. embed_query()         │
                   │     POST ollama/embed     │
                   │     model: nomic-embed-text│
                   │     → vector[768]         │
                   │                           │
                   │  2. similarity_search()   │
                   │     SELECT dc.content,    │
                   │       dc.document_id,     │
                   │       1 - (dc.embedding   │
                   │         <=> $1) AS score  │
                   │     FROM document_chunks dc│
                   │     JOIN documents d ON …  │
                   │     ORDER BY score DESC   │
                   │     LIMIT 5               │
                   │                           │
                   │  3. build_prompt()        │
                   │     System: "You are a   │
                   │     QMS assistant for     │
                   │     Apex Glass..."        │
                   │     Context: [5 chunks]   │
                   │     User: {query}         │
                   │                           │
                   │  4. stream_llm()          │
                   │     POST ollama/generate  │
                   │     model: qwen2.5:7b     │
                   │     stream: true          │
                   │                           │
                   │  5. yield SSE events      │
                   │     status → sources →    │
                   │     tokens → done         │
                   └────────────┬──────────────┘
                                │
                    SSE stream to frontend
                                │
                    search.js consumes events:
                    - status events → update status bar
                    - sources event → store for citations render
                    - token events → append to typewriter buffer
                    - done event → render citations panel
```

### System Prompt Template
```
You are an expert Quality Management System assistant for Apex Glass Technologies,
a specialty glass and optical fiber manufacturer.

Answer questions using ONLY the context documents provided below.
Be specific — cite document numbers, version numbers, dates, and parameter values
when they appear in the context.
If the context does not contain enough information to answer fully, say so clearly.
Do not invent regulatory citations or specifications not present in the context.

Format your response with markdown: use **bold** for document IDs, parameter values,
and key findings. Use bullet lists for multiple items.

Context documents:
{context}
```

---

## Frontend Screens — Detailed Wiring

### Global State (api.js)
```js
export const API_BASE = '/api';

// Wraps fetch with error handling and JSON parsing
export async function apiFetch(path, opts = {}) { ... }

// Connects to SSE endpoint, calls onEvent(event) for each data: line
export function apiStream(path, body, onEvent) { ... }
```

---

### Screen 1: Dashboard (`app.js`)

**Stats cards** — on `initDashboard()`:
1. `GET /api/health` → `chunk_count` → displayed as "documents indexed" context in sidebar
2. `GET /api/documents` → `length` → animate counter to `stat-documents`
3. `GET /api/capas?status=Open,In Progress` → `length` → animate to `stat-capas`
4. `GET /api/capas?status=Pending Review` → `length` → animate to `stat-reviews`
5. `GET /api/audit?ai_only=true&limit=1&since=today` → count → animate to `stat-ai-actions`
6. Compliance score: `(closed_capas / total_capas) * 0.4 + (docs_with_next_review_future / total_docs) * 0.6` — computed client-side from API data, animated to `stat-compliance`

**Activity feed** — on `initDashboard()`:
- `GET /api/audit?limit=10` → map to activity feed items
- Each audit entry maps to: `{time: relative(timestamp), action: human_readable(action, resource_name), type: action_type, icon: icon_key}`
- Action → icon mapping: UPLOAD→file, SEARCH→search, GENERATE_RCA→sparkles, CLASSIFY→brain, APPROVE→check, EMBED→brain
- Type → color mapping: same as demo (`classification`→purple, `analysis`→cyan, etc.)
- Live stream: poll `GET /api/audit?limit=1&since=last_seen_id` every 8 seconds, prepend new items exactly as the demo's `startActivityStream()` does (same `scale-in` animation, same "LIVE" badge)

**Sidebar compliance bar**: reuse the computed compliance score, animate `confidence-fill` width

**Upcoming deadlines**: `GET /api/capas?status=Open,In Progress` → sort by `target_close` → show next 4 with color coding (red if <14 days, amber if <30 days)

**"Ask AI Anything" card**: still navigates to `#search` on click, updates copy: "Search across {chunk_count} chunks indexed"

---

### Screen 2: AI Search (`search.js`)

**On `initSearch()`:**
1. Fetch suggested queries from `GET /api/documents` — use the first 3 document titles as seeds for suggested queries, formatted as natural language questions. Hardcode the 3 suggested query templates; swap in real doc titles/numbers from the API response.
2. Render suggested query chips exactly as demo (same CSS classes, same hover behavior)

**On search submit / suggested query click:**
1. Show spinner status: "Searching across {chunk_count} chunks…" (fetch chunk_count from cached health response)
2. Call `apiStream('/api/search', {query}, onEvent)`
3. On `status` event → update `#search-status` text
4. On `sources` event → store sources array (don't render yet)
5. On `token` event → append to typewriter buffer. Do NOT call `typewriterEffect()` per-token — buffer tokens and use the existing `typewriterEffect()` on the full assembled response when `done` arrives. This preserves the typewriter animation exactly.
6. On `done` event:
   - Call `typewriterEffect(responseEl, fullResponse, 5, callback)` — same speed as demo
   - After typing completes, call `renderCitations(sources, citationsEl)` — same function as demo
7. Click-to-skip behavior: preserved exactly (the `completeInstantly` click handler on the response element)

**Status bar progression** (matches demo timing exactly):
- t=0: spinner + "Embedding query and searching {N} chunks…"
- on sources event: spinner + "Reading {source_count} relevant sources… synthesizing answer"
- on done event: checkmark + "Found {source_count} sources · synthesized in {elapsed_ms/1000}s · RAG-Powered badge"

**Citations panel** (`renderCitations`): identical to demo — `citation-card` with `fade-in-up`, relevance bar animation at 300ms + i*120ms offset. Relevance score comes from actual cosine similarity (0.0–1.0 from API).

**Compare callout** at bottom: unchanged HTML, no wiring needed.

---

### Screen 3: Documents (`documents.js`)

**On `initDocuments()` / `onDocumentsVisible()`:**
1. `GET /api/documents` → render document list table
2. Table columns: Doc Number (monospace purple), Title, Type (badge), Status (badge), Version, Owner, Dept, Last Review, Next Review, AI Score (confidence bar), Actions

**Document type filter pills:**
- Types derived from API response (unique doc_types)
- "All" pill always first, then one per type
- Clicking filters the rendered table client-side (no new API call)
- Same `.filter-pill` / `.filter-pill.active` classes

**Upload button → file picker:**
1. `<input type="file" accept=".txt,.pdf">` hidden, triggered by button click
2. Show upload metadata form (doc_number, title, doc_type, version, author, department)
3. `POST /api/documents/upload` multipart
4. During upload: show scanning animation overlay on the upload area (same `.scan-line.scanning` CSS class — add it programmatically)
5. On success: prepend new document to table with `scale-in` animation, show success toast

**"AI Analyze" button per row:**
1. Trigger `POST /api/documents/{id}/analyze`
2. During analysis: show `.scan-line.scanning` on that document row
3. Show thinking dots in the analysis panel
4. On response: render AI analysis panel below the table (same layout as `SAMPLE_DOCUMENT.aiAnalysis` in demo):
   - Document type classification with confidence bar
   - Regulatory refs list with confidence scores
   - Key entities table (entity, value, type)
   - Action items list
   - Suggested tags as chips
   - Related documents as clickable links (navigate to that doc's detail)
5. `audit_log` call happens server-side automatically — no client action needed

---

### Screen 4: CAPA Workflow (`workflow.js`)

**On `initWorkflow()`:**
1. `GET /api/capas` → show CAPA selector (dropdown or list of badges)
2. Default to first CAPA in the list (same as demo defaulting to CAPA-089)
3. `GET /api/capas/{id}` → render header, timeline, RCA panel, actions, risk

**CAPA Header** (`renderCAPAHeader`): identical to demo — capa_number, status badge, priority badge, AI-Assisted badge, title, owner, opened_date, target_close, source_ncr

**Timeline** (`renderTimeline`): identical to demo — timeline dots with `completed` / `in-progress` / `pending` classes, AI badge per event, `fade-in-up` with stagger

**AI Root Cause Analysis panel** (`renderRootCause`):
- Shows if `root_cause` is populated on the CAPA record
- If NOT analyzed yet: shows "Generate Analysis" button prominently
- "Generate Analysis" calls `POST /api/capas/{id}/analyze`
  - During: show thinking dots + "AI is analyzing {N} related documents…"
  - On response: render full RCA panel with `scale-in` animation
  - Confidence bar animates in at 400ms (same as demo)

**Corrective & Preventive Actions** (`renderActions`): identical to demo — approve/modify buttons with the same state transitions. On approve: `PATCH /api/capas/{id}` updating `corrective_actions[i].status = 'Approved'`. On modify: open inline text edit (simple `contenteditable` on the action text).

**Risk Assessment** (`renderRiskAssessment`): identical to demo — severity/likelihood/risk level grid, customer impact, regulatory impact.

---

### Screen 5: Audit Trail (`audit.js`)

**On `initAudit()`:**
1. `GET /api/audit?limit=50` → render table
2. Table columns: Timestamp (monospace), User, Role, Action, Resource, AI Involved (badge), Signature (Verified/System/N/A), IP

**Filter bar:**
- "All" | "Human" | "AI Only" | "Documents" | "CAPAs" | "Search" pills
- Filter client-side against fetched data

**AI Involved column:**
- `true` → `badge-ai` with "AI" text
- `false` → plain text "Human"

**Signature column:**
- Populated entries → "Verified" in emerald
- AI system entries → "System" in slate
- No signature → "N/A" in muted

**Action type → color:**
- UPLOAD, EMBED → purple
- SEARCH, GENERATE_RCA, GENERATE_ANALYSIS, CLASSIFY → cyan
- APPROVE, UPDATE_STATUS → emerald
- VIEW, EXPORT → slate

---

### Screen 6: Knowledge Graph (`graph.js`)

**On `initGraph()` + `startGraph()`:**
1. `GET /api/graph` → `{nodes, edges}`
2. Map API response to the D3 simulation format the demo already uses
3. Node `group_key` → color from `GRAPH_COLORS` (same map as demo's `data.js`)
4. Node `size` from API (set by `graph_builder.py` based on connectivity)
5. Edge `relationship` → edge label on hover (same as demo)
6. Everything else in `graph.js` is unchanged — D3 simulation, drag, click interactions

**Node colors (preserved from demo):**
```js
const GRAPH_COLORS = {
  sop:        '#8b5cf6',  // Purple
  wi:         '#6366f1',  // Indigo
  capa:       '#f59e0b',  // Amber
  ncr:        '#ef4444',  // Red
  person:     '#10b981',  // Emerald
  process:    '#06b6d4',  // Cyan
  regulation: '#f97316',  // Orange
  supplier:   '#ec4899',  // Pink
};
```

---

## Seed Documents — Full Content Outline

Each seed document must be substantive enough to produce meaningful, differentiated RAG results. Minimum 400 words per document. All use Apex Glass Technologies domain language.

### SOP-2024-031 — Optical Fiber Draw Process Control
- Purpose, scope (Lines 1-4, Building 7)
- Process parameters: draw temp 2050°C ±15°C, speed 20-25 m/s, tension 45-55g, fiber diameter 125.0 ±0.7 μm, coating diameter 245 ±5 μm
- SPC requirements, ±3σ control limits, escalation matrix
- NCR initiation SLA: 4 hours
- References: ISO 9001:2015, IEC 60793-2-50, FDA 21 CFR 820, IATF 16949, WI-4455, WI-4420

### SOP-2024-028 — Glass Substrate Cleaning Procedure
- Purpose: display glass substrate cleaning prior to coating
- Chemical sequence: DI water rinse, IPA wipe, megasonic clean
- Cleanliness verification: particle count <5 @ 0.5μm
- References: ISO 14644-1 (cleanroom), customer spec CS-DG-001

### SOP-2024-019 — Fusion Draw Machine Calibration
- Calibration intervals: daily, weekly, quarterly
- Parameters: overflow temperature, pull-down speed, glass ribbon thickness
- Only Level 2 certified operators may adjust calibration
- References: IATF 16949 §7.1.5, MSA requirements

### WI-4420 — Borosilicate Glass Batch Mixing
- Batch formulation: SiO2 (72%), B2O3 (13%), Na2O (9%), Al2O3 (4%), K2O (2%)
- Mixing sequence, times, temperatures
- Incoming material inspection requirements for each component
- Traceability requirements for lot numbers

### WI-4455 — Fiber Preform Deposition Parameters
- MCVD process parameters: O2/SiCl4 ratios, deposition temperatures, rotation speeds
- Refractive index profile requirements
- Preform geometry acceptance criteria

### WI-4398 — Anti-Reflective Coating Application
- Coating chamber conditions: pressure, temperature, deposition rate
- AR coating target: reflectance <0.5% at 1550nm
- Post-coat verification: ellipsometry measurement procedure

### CAPA-089 — Fiber Draw Tension Deviation (Line 3)
- Full description of the Nov 28 tension excursion event
- 12 spools quarantined, yield loss ~$34,200
- Timeline of events from detection through CAPA opening
- References SOP-2024-031 control limits (UCL 55g, actual peak 62g)
- Heating element runtime data (4,200 of 4,500 hr rated life)
- Links to CAPA-071 (similar Line 2 incident, March 2024)

### CAPA-087 — Substrate Thickness Variation (Supplier B)
- Incoming inspection data showing Cpk declining from 1.8 to 1.1 over 6 months
- Batch Materials Co. (SUP-003) identified as source
- 3 production delays in Q4, 2.1% scrap rate increase
- Proposed actions: AQL tightening, dual-source qualification

### NCR-2024-156 — Refractive Index Out of Spec (Batch 7842)
- Silica Source Inc. (SUP-001) batch received Nov 30
- Measured refractive index 1.4589 vs spec 1.4570–1.4585
- 100% of batch on hold
- Links to CAPA-089 and previous NCR-2024-141

### NCR-2024-141 — Surface Defect (Gorilla Glass Lot 22B)
- Micro-inclusions found during incoming inspection
- 15% of lot rejected
- Supplier corrective action request issued to Batch Materials Co.

### AR-2024-Q3 — Internal Audit Report (Fiber Division)
- Scope: ISO 9001:2015 §8 (Operations) and §9 (Performance Evaluation)
- 2 minor findings: training record gaps, calibration label missing on one gauge
- 3 observations including supplier performance trend for SUP-001
- Overall rating: Satisfactory

### TR-2024-015 — FDM Operator Training Record
- Training matrix with 4 certification levels
- Expiry tracking: 3 operators with Level 1 expiring Feb 2025
- Links to SOP-2024-019 for calibration requirements

---

## Docker Compose Services

```yaml
version: '3.9'
services:

  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: qms
      POSTGRES_USER: qms
      POSTGRES_PASSWORD: qms
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qms"]
      interval: 5s
      timeout: 5s
      retries: 10

  ollama:
    image: ollama/ollama
    volumes:
      - ollamadata:/root/.ollama
    # Models pulled by seed.py on first start via API call

  backend:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: qms
      DB_USER: qms
      DB_PASSWORD: qms
      OLLAMA_HOST: http://ollama:11434
      EMBED_MODEL: nomic-embed-text
      LLM_MODEL: qwen2.5:7b
    ports:
      - "8000:8000"

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
  ollamadata:
```

**Nginx config** — serves static files at `/`, proxies `/api/` to `http://backend:8000/api/`:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # Required for SSE:
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Startup sequence:**
1. `db` starts, passes healthcheck
2. `backend` starts, lifespan handler:
   a. Wait for Ollama to respond (retry loop, max 60s)
   b. Pull models if not present: `ollama pull nomic-embed-text`, `ollama pull qwen2.5:7b`
   c. Run `seed.py` — idempotent (checks if documents table is empty before inserting)
   d. Mark ready, begin accepting requests
3. `frontend` starts (nginx is instant)
4. Access: `http://localhost` (frontend) | `http://localhost:8000/docs` (Swagger)

---

## Testing Strategy

### Test file per router + per service

**`conftest.py`:**
- `test_db` fixture: separate `qms_test` database, created fresh per test session
- `test_client` fixture: FastAPI `TestClient` with overridden DB pool pointing to `test_db`
- `mock_ollama` fixture: `httpx_mock` or `respx` mocking Ollama API calls
  - Embed: returns deterministic 768-dim vector
  - Generate: returns a fixed response string for known prompts

**`test_health.py`:**
- `GET /api/health` returns 200 with all expected fields
- DB connected field is true
- Ollama field is "ready" when mock returns OK

**`test_documents.py`:**
- Upload a `.txt` file → response contains `chunk_count > 0`
- `GET /api/documents` returns the uploaded doc
- `GET /api/documents/{id}` returns correct fields
- Embed was called once per chunk (assert mock call count)
- Audit log entry was created with action=UPLOAD

**`test_search.py`:**
- Upload a known document with known content
- Search for a phrase that appears verbatim in that document
- Assert the source doc appears in the SSE `sources` event
- Assert relevance score > 0.7 for exact match
- Assert audit log entry created with action=SEARCH

**`test_capas.py`:**
- Create a CAPA via `POST /api/capas`
- `GET /api/capas/{id}` returns it
- `POST /api/capas/{id}/analyze` triggers LLM (mocked)
- Assert response contains all required JSON fields (root_cause, corrective_actions, etc.)
- Assert corrective_actions is a list with at least 1 item
- Assert audit log entry created with action=GENERATE_RCA

**`test_audit.py`:**
- After any upload/search/analyze, `GET /api/audit` returns entries
- `ai_involved=true` entries have `ai_model` set
- Signature field is a valid SHA-256 hex string (64 chars)
- `GET /api/audit?ai_only=true` returns only AI entries

**`test_graph.py`:**
- After seeding, `GET /api/graph` returns nodes and edges
- Node types include `document`, `person`, `regulation`
- At least one edge with relationship=`governs` (regulation → document)

---

## Key Impression Points

1. **"Ask it anything and it answers from the actual documents"** — type a natural language question, watch it cite real doc numbers with real snippets
2. **"Upload a document and watch it get indexed in real time"** — scanning animation plays over actual embedding pipeline progress
3. **"That CAPA analysis was generated from the NCR text, not a template"** — grounded generation: the AI's RCA references specific parameter values from the source document
4. **"Every single AI action is in the audit log, signed"** — compliance story is earned: SHA-256 signature, real timestamps, real user attribution
5. **"This runs on your hardware, no cloud, no API keys"** — data sovereignty: unplug the internet, it still works
6. **"Same UI. Real backend."** — the demo wasn't vaporware. It became a product.

---

## What Changed vs the Demo

| Area | Demo | Real System |
|------|------|-------------|
| `data.js` | Hardcoded fake data | Replaced with `api.js` calls |
| Search responses | Mocked strings with keyword matching | LLM generation from real retrieved chunks |
| Relevance scores | Hardcoded floats | Real cosine similarity from pgvector |
| Document upload | Visual animation only | Real chunking → embedding → pgvector storage |
| CAPA RCA | Static object in `data.js` | LLM generation grounded in related document chunks |
| Audit log | Fake entries array | Real DB records, written on every action |
| Knowledge graph | Static node/edge list in `data.js` | Extracted from document relationships + CAPA links |
| Activity feed | Hardcoded + timer-cycled | Real audit log entries, polled every 8s |
| Dashboard stats | Hardcoded numbers | Computed from live API data |
| Hosting | `python3 -m http.server` | Docker Compose: Nginx + FastAPI + PostgreSQL + Ollama |
| Visual design | Stunning | Unchanged. Still stunning. |
