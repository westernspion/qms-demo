"""
conftest.py — pytest fixtures for QMS backend tests.
Uses a separate test database, mocked Ollama, and an overridden DB pool.
"""

import asyncio
import hashlib
import json
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch

import asyncpg
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

# ---------------------------------------------------------------------------
# Deterministic mock embedding — always returns a stable 768-dim vector
# ---------------------------------------------------------------------------
MOCK_EMBEDDING = [0.1] * 768


def _mock_embed_response(text: str) -> list[float]:
    """Deterministic embedding: hash text to vary first dim slightly."""
    h = int(hashlib.md5(text.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    v = MOCK_EMBEDDING.copy()
    v[0] = h
    return v


# ---------------------------------------------------------------------------
# Event loop fixture (session-scoped)
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# Test DB pool — connects to qms_test database
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="session")
async def test_db_pool():
    """Create a test database pool pointing at qms_test."""
    import os

    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "5432"))

    # Create test DB if needed (connect to 'qms' first)
    sys_conn = await asyncpg.connect(
        host=host, port=port, database="qms", user="qms", password="qms"
    )
    exists = await sys_conn.fetchval(
        "SELECT 1 FROM pg_database WHERE datname = 'qms_test'"
    )
    if not exists:
        await sys_conn.execute("CREATE DATABASE qms_test")
    await sys_conn.close()

    pool = await asyncpg.create_pool(
        host=host,
        port=port,
        database="qms_test",
        user="qms",
        password="qms",
        min_size=1,
        max_size=5,
    )

    # Init schema
    from db import _create_schema

    async with pool.acquire() as conn:
        await _create_schema(conn)

    yield pool

    await pool.close()


# ---------------------------------------------------------------------------
# FastAPI test client with overridden DB pool
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def app(test_db_pool):
    """Return a FastAPI app with DB pool overridden to test pool.
    We bypass the lifespan (which pulls models + seeds) by patching init_db.
    """
    import db as db_module
    import main

    # Pre-set the pool before any lifespan code runs
    db_module._pool = test_db_pool

    # Patch init_db to be a no-op (returns our test pool, does NOT recreate it)
    async def noop_init_db():
        return test_db_pool

    # Patch seed and model pull to no-ops
    async def noop_seed():
        pass

    async def noop_pull():
        pass

    async def noop_wait():
        pass

    import unittest.mock as mock

    main.init_db = noop_init_db

    return main.app


@pytest.fixture
def client(app, monkeypatch, test_db_pool):
    """Sync test client — bypasses lifespan startup."""
    import db as db_module

    # Ensure pool is set each time (session fixtures may reset across module boundaries)
    db_module._pool = test_db_pool

    # Patch lifespan dependencies to prevent model pulling or seeding
    async def noop_wait_for_ollama(*args, **kwargs):
        pass

    async def noop_pull_models():
        pass

    async def noop_run_seed():
        pass

    async def noop_init_db():
        return test_db_pool

    import main

    monkeypatch.setattr(main, "_wait_for_ollama", noop_wait_for_ollama)
    monkeypatch.setattr(main, "_pull_models", noop_pull_models)
    monkeypatch.setattr(main, "_run_seed", noop_run_seed)
    monkeypatch.setattr("db.init_db", noop_init_db)

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest_asyncio.fixture
async def async_client(app):
    """Async test client for async test cases."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# Mock Ollama fixture
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_ollama(monkeypatch):
    """Mock all Ollama calls to return deterministic responses."""

    async def fake_embed(text: str) -> list[float]:
        return _mock_embed_response(text)

    async def fake_embed_and_store(pool, document_id, text, extra_metadata=None):
        chunks = text.split("\n\n")[:5]  # Use first 5 paragraphs as fake chunks
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM document_chunks WHERE document_id = $1", document_id
            )
            for i, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue
                vector = _mock_embed_response(chunk)
                vec_str = "[" + ",".join(str(v) for v in vector) + "]"
                await conn.execute(
                    """
                    INSERT INTO document_chunks
                      (document_id, chunk_index, content, embedding, token_count, metadata)
                    VALUES ($1, $2, $3, $4::vector, $5, $6)
                    """,
                    document_id,
                    i,
                    chunk,
                    vec_str,
                    len(chunk.split()),
                    json.dumps({"chunk_index": i}),
                )
        return len(chunks)

    MOCK_LLM_RESPONSE = json.dumps(
        {
            "root_cause": "Mock root cause from test",
            "root_cause_confidence": 0.85,
            "root_cause_details": ["Detail 1", "Detail 2"],
            "contributing_factors": ["Factor A"],
            "corrective_actions": [
                {
                    "action": "Fix the issue",
                    "priority": "High",
                    "owner": "Engineer",
                    "due_date": "2025-03-01",
                    "status": "Pending",
                }
            ],
            "corrective_confidence": 0.80,
            "preventive_actions": [
                {"action": "Prevent recurrence", "priority": "Medium", "owner": "QA"}
            ],
            "preventive_confidence": 0.75,
            "risk_severity": "Moderate",
            "risk_likelihood": "Possible",
            "risk_level": "Medium",
            "risk_score": 5,
            "risk_confidence": 0.80,
            "customer_impact": "Minimal impact expected",
            "regulatory_impact": "ISO 9001 §10.2 satisfied",
        }
    )

    monkeypatch.setattr("services.embeddings.embed_text", fake_embed)
    monkeypatch.setattr("services.embeddings.embed_and_store", fake_embed_and_store)

    # Patch httpx for LLM calls
    import httpx
    from unittest.mock import MagicMock

    class MockResponse:
        status_code = 200

        def json(self):
            return {"response": MOCK_LLM_RESPONSE}

        def raise_for_status(self):
            pass

    class MockAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return MockResponse()

        async def get(self, *args, **kwargs):
            r = MockResponse()
            r.json = lambda: {
                "models": [{"name": "qwen2.5:7b"}, {"name": "nomic-embed-text"}]
            }
            return r

    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)

    return {"embedding": fake_embed, "llm_response": MOCK_LLM_RESPONSE}
