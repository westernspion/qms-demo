# Apex Glass Technologies — AI-Native QMS Demo

A fully local, RAG-powered Quality Management System for a fictional specialty glass manufacturer. Documents are uploaded, chunked, embedded, and stored in PostgreSQL with pgvector. Users query in natural language and get answers synthesized from actual document content. CAPAs, NCRs, and audit trails are real database records.

> Runs entirely locally via `docker compose up` — no cloud, no API keys, no npm, no build step.

![glassmorphism dark UI with purple/cyan glow palette](.github/screenshot.png)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS ES modules, Tailwind CSS CDN, D3.js |
| Backend | Python 3.11, FastAPI (async), Pydantic v2 |
| Database | PostgreSQL 16 + pgvector |
| LLM / Embeddings | Ollama — `qwen2.5:3b` + `nomic-embed-text` |
| RAG pipeline | LangChain (retrieval + prompting only) |
| Infra | Docker Compose, Nginx |

---

## Quickstart

```bash
# 1. Copy env and start everything
cp .env.example .env
docker compose up --build

# 2. On first run, Ollama will pull models (~2GB). Watch progress:
docker compose logs -f ollama

# 3. Open the app
open http://localhost
```

The seed script runs automatically on startup — it creates the schema and loads 12 real QMS documents (SOPs, WIs, CAPAs, NCRs, audit records) into pgvector if the DB is empty.

---

## Features

- **RAG Search** — natural language queries over embedded QMS documents with streamed answers and inline citations
- **Document Management** — upload PDFs/text, AI-powered classification and entity extraction
- **CAPA Workflow** — create/approve corrective actions with AI root-cause analysis and risk scoring
- **Audit Log** — full audit trail of all system actions
- **Knowledge Graph** — D3 visualization of document relationships and cross-references
- **AI Analysis** — per-document and per-CAPA agent analysis backed by the local LLM

---

## Architecture

```
Browser → Nginx → FastAPI → asyncpg → PostgreSQL (pgvector)
                         ↘ Ollama (embed + generate)
```

- All embeddings are 768-dim via `nomic-embed-text`
- Similarity search uses pgvector's `<=>` cosine operator
- RAG answers stream back to the browser via SSE

---

## Environment Variables

```ini
DB_HOST=db
DB_PORT=5432
DB_NAME=qms
DB_USER=qms
DB_PASSWORD=qms
OLLAMA_HOST=http://ollama:11434
EMBED_MODEL=nomic-embed-text
GEN_MODEL=qwen2.5:3b
```

On machines with 8GB+ RAM available to Docker, swap `GEN_MODEL=qwen2.5:7b` for better quality answers.

---

## Project Structure

```
rag-qms-demo/
├── backend/
│   ├── main.py            # FastAPI app
│   ├── routers/           # health, documents, search, capas, audit, graph
│   ├── services/          # embeddings, rag, document_intel, capa_agent, graph_builder
│   └── seed/              # schema init + 12 seed documents
├── frontend/
│   ├── index.html
│   ├── css/custom.css     # glassmorphism / glow — do not modify
│   └── js/                # app, api, search, documents, workflow, audit, graph, effects
├── nginx/nginx.conf
├── docker-compose.yml
├── SPEC.md                # authoritative implementation reference
└── AGENTS.md              # agent collaboration guide
```
