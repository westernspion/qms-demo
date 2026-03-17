# AGENTS.md — Apex Glass Technologies AI-Native QMS

## Project
A real, working RAG-powered QMS. Documents are uploaded, embedded via Ollama, stored in PostgreSQL+pgvector, and queried with natural language. The visual layer from the original demo is preserved exactly.

## Read First
1. Read `SPEC.md` — full architecture, schema, file structure, and impression points.

## Tech Rules

### Frontend
- **Tailwind CSS via CDN** — no npm, no build tools
- **Vanilla JS with ES modules** — `type="module"` in script tags
- Zero new CDN dependencies (D3 for graph is already in use)
- `css/custom.css` is sacred — do not change the visual design system
- All API calls go through `js/api.js` — no raw fetch calls in feature files
- The typewriter/streaming effect stays — use SSE from the backend

### Backend
- **Python / FastAPI** — async, typed, Pydantic schemas
- **PostgreSQL 16 + pgvector** — all persistence, all embeddings
- **Ollama** — `nomic-embed-text` for embeddings, `qwen2.5:7b` for generation
- **LangChain** — RAG pipeline only (retrieval + prompt assembly)
- **No ORM magic** — use raw asyncpg or SQLAlchemy Core for queries, not heavy ORM patterns
- **Docker Compose** — single `docker compose up` must bring up everything

### Forbidden
- No external API keys (no OpenAI, no Anthropic, nothing cloud)
- No npm / no build step / no TypeScript
- No new Python frameworks beyond what's in `requirements.txt`
- Do not touch `css/custom.css` color variables or animation classes

## Code Style

### Python
- Async everywhere (`async def`, `await`)
- Pydantic v2 models for all request/response shapes
- Services in `backend/services/` do the work; routers in `backend/routers/` just route
- Log every AI action to `audit_log` table — this is non-negotiable
- Seed data lives in `backend/seed/` — run once on first start

### JavaScript
- Keep files focused by feature area (search.js only does search)
- `api.js` is the only file that knows the backend URL
- Comments for non-obvious animations or timing choices
- Error states must look good — use the same glass card styling

## Environment
```
DB_HOST=db
DB_PORT=5432
DB_NAME=qms
DB_USER=qms
DB_PASSWORD=qms
OLLAMA_HOST=http://ollama:11434
EMBED_MODEL=nomic-embed-text
LLM_MODEL=qwen2.5:7b
```

## Startup Sequence
1. `docker compose up`
2. Backend health-checks DB + Ollama before accepting requests
3. On first start: `seed.py` creates tables, pulls models, loads and embeds seed docs
4. Frontend: `http://localhost:80`
5. API docs: `http://localhost:8000/docs`

## Development Workflow

### TDD is mandatory
For every backend feature:
1. Write the test first — it captures intent and serves as documentation
2. Run it to confirm it fails (validates the test is real)
3. Implement the minimum code to make it pass
4. Refactor if needed
5. Commit when green

Tests live in `backend/tests/`. Use `pytest` + `pytest-asyncio`. Each router and service gets its own test file.

### Commit between phases
At the completion of each phase below, create a git commit before starting the next. Do not bundle multiple phases into one commit. Commit message format: emoji + semantic description (e.g. `🐘 phase 1: docker compose + db schema + migrations`).

## Priority / Build Phases

### Phase 1 — Foundation
Docker Compose scaffold, Postgres + pgvector schema, migrations, FastAPI skeleton with health endpoint. **Commit when green.**

### Phase 2 — Document Pipeline
Upload endpoint, chunking, Ollama embedding, pgvector storage, document list/detail endpoints. TDD: test upload → chunk → embed → retrieve round-trip. **Commit when green.**

### Phase 3 — RAG Search
Embed query, pgvector cosine similarity retrieval, LangChain prompt assembly, Ollama generation, SSE streaming. TDD: test retrieval quality with known queries against seed data. **Commit when green.**

### Phase 4 — CAPA AI Agent
CAPA CRUD endpoints, AI analysis trigger (RCA + actions + risk score), audit log integration. TDD: test RCA generation returns structured JSON. **Commit when green.**

### Phase 5 — Frontend Wiring
Replace `data.js` mock responses with real API calls via `api.js`. Wire each screen to its endpoint. SSE typewriter for search. **Commit when green.**

### Phase 6 — Knowledge Graph
Graph node/edge extraction from documents and CAPAs, `GET /api/graph` endpoint, frontend D3 rendering from real data. **Commit when green.**

## When In Doubt
- The visual design is done — don't redesign, just wire it up
- If a feature isn't in SPEC.md, don't build it
- Real data beats fake data, but fake data beats broken data — seed well
- The audit log is not optional — log everything
