"""
test_health.py — Tests for GET /api/health
"""

import pytest


def test_health_returns_200(client, mock_ollama):
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_has_required_fields(client, mock_ollama):
    response = client.get("/api/health")
    data = response.json()
    required = [
        "status",
        "db",
        "ollama",
        "embed_model",
        "llm_model",
        "document_count",
        "capa_count",
        "chunk_count",
    ]
    for field in required:
        assert field in data, f"Missing field: {field}"


def test_health_db_connected(client, mock_ollama):
    response = client.get("/api/health")
    data = response.json()
    assert data["db"] == "connected"


def test_health_status_ok(client, mock_ollama):
    response = client.get("/api/health")
    data = response.json()
    assert data["status"] == "ok"


def test_health_model_names(client, mock_ollama):
    response = client.get("/api/health")
    data = response.json()
    assert data["embed_model"] == "nomic-embed-text"
    assert data["llm_model"] == "qwen2.5:7b"
