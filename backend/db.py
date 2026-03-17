"""
db.py — asyncpg connection pool + schema creation.
pgvector extension is enabled here; tables are created idempotently.
"""

import asyncpg
from config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        raise RuntimeError("DB pool not initialised — call init_db() first")
    return _pool


async def init_db() -> asyncpg.Pool:
    """Create the connection pool and ensure schema exists."""
    global _pool
    _pool = await asyncpg.create_pool(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        min_size=2,
        max_size=10,
    )
    async with _pool.acquire() as conn:
        await _create_schema(conn)
    return _pool


async def close_db() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def _create_schema(conn: asyncpg.Connection) -> None:
    """Create pgvector extension and all tables idempotently."""
    await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    await conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doc_number      TEXT UNIQUE NOT NULL,
            title           TEXT NOT NULL,
            doc_type        TEXT NOT NULL,
            status          TEXT NOT NULL DEFAULT 'Active',
            version         TEXT NOT NULL DEFAULT '1.0',
            author          TEXT,
            department      TEXT,
            regulatory_refs TEXT[],
            ai_score        FLOAT,
            last_review     DATE,
            next_review     DATE,
            raw_text        TEXT,
            file_name       TEXT,
            metadata        JSONB DEFAULT '{}',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS document_chunks (
            id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            chunk_index   INT NOT NULL,
            content       TEXT NOT NULL,
            embedding     vector(768),
            token_count   INT,
            metadata      JSONB DEFAULT '{}',
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)

    # ivfflat index — only create if there are enough rows (or skip safely)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
            ON document_chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS document_chunks_doc_id_idx
            ON document_chunks (document_id);
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS capas (
            id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            capa_number           TEXT UNIQUE NOT NULL,
            title                 TEXT NOT NULL,
            status                TEXT NOT NULL DEFAULT 'Open',
            priority              TEXT NOT NULL DEFAULT 'Medium',
            phase                 TEXT,
            owner                 TEXT,
            department            TEXT,
            source_doc_id         UUID REFERENCES documents(id),
            source_ncr            TEXT,
            description           TEXT NOT NULL,
            root_cause            TEXT,
            root_cause_confidence FLOAT,
            corrective_actions    JSONB,
            corrective_confidence FLOAT,
            preventive_actions    JSONB,
            preventive_confidence FLOAT,
            risk_severity         TEXT,
            risk_likelihood       TEXT,
            risk_level            TEXT,
            risk_score            INT,
            risk_confidence       FLOAT,
            customer_impact       TEXT,
            regulatory_impact     TEXT,
            ai_analyzed_at        TIMESTAMPTZ,
            opened_date           DATE NOT NULL DEFAULT CURRENT_DATE,
            target_close          DATE,
            closed_at             TIMESTAMPTZ,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS capa_timeline (
            id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            capa_id      UUID NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
            event_date   DATE NOT NULL,
            event        TEXT NOT NULL,
            status       TEXT NOT NULL DEFAULT 'pending',
            ai_involved  BOOLEAN NOT NULL DEFAULT false,
            sort_order   INT NOT NULL DEFAULT 0
        );
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
            user_id       TEXT NOT NULL DEFAULT 'system',
            user_name     TEXT NOT NULL,
            user_role     TEXT,
            action        TEXT NOT NULL,
            resource_type TEXT,
            resource_id   UUID,
            resource_name TEXT,
            ai_involved   BOOLEAN NOT NULL DEFAULT false,
            ai_model      TEXT,
            details       JSONB DEFAULT '{}',
            ip_address    TEXT DEFAULT 'internal',
            signature     TEXT
        );
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx
            ON audit_log (timestamp DESC);
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS audit_log_resource_id_idx
            ON audit_log (resource_id);
    """)
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS audit_log_ai_involved_idx
            ON audit_log (ai_involved);
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS graph_nodes (
            id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            node_key  TEXT UNIQUE NOT NULL,
            label     TEXT NOT NULL,
            node_type TEXT NOT NULL,
            group_key TEXT NOT NULL,
            size      INT DEFAULT 12,
            metadata  JSONB DEFAULT '{}'
        );
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS graph_edges (
            id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            source_key   TEXT NOT NULL REFERENCES graph_nodes(node_key),
            target_key   TEXT NOT NULL REFERENCES graph_nodes(node_key),
            relationship TEXT NOT NULL,
            weight       FLOAT DEFAULT 1.0,
            ai_extracted BOOLEAN DEFAULT false
        );
    """)
