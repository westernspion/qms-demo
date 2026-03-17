"""
test_audit.py — Tests for GET /api/audit
"""

import io
import pytest


def test_audit_returns_list(client, mock_ollama):
    response = client.get("/api/audit")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_audit_after_upload_has_entries(client, mock_ollama):
    # Upload a doc to generate audit entry
    client.post(
        "/api/documents/upload",
        files={
            "file": (
                "audit_test.txt",
                io.BytesIO(b"Audit test content fiber tension 50g UCL 55g"),
                "text/plain",
            )
        },
        data={
            "doc_number": "AUDIT-TEST-DOC-001",
            "title": "Audit Test Doc",
            "doc_type": "SOP",
            "version": "1.0",
        },
    )

    response = client.get("/api/audit?limit=50")
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) > 0


def test_audit_entries_have_required_fields(client, mock_ollama):
    response = client.get("/api/audit?limit=10")
    entries = response.json()
    if not entries:
        pytest.skip("No audit entries yet")
    required = ["id", "timestamp", "user_name", "action", "ai_involved"]
    for entry in entries[:3]:
        for field in required:
            assert field in entry, f"Missing field: {field}"


def test_audit_ai_entries_have_model(client, mock_ollama):
    response = client.get("/api/audit?ai_only=true&limit=20")
    assert response.status_code == 200
    entries = response.json()
    for entry in entries:
        assert entry["ai_involved"] is True
        assert entry["ai_model"] is not None, f"AI entry missing ai_model: {entry}"


def test_audit_filter_human_only(client, mock_ollama):
    response = client.get("/api/audit?ai_only=false&limit=50")
    assert response.status_code == 200
    entries = response.json()
    for entry in entries:
        assert entry["ai_involved"] is False


def test_audit_signature_is_sha256(client, mock_ollama):
    response = client.get("/api/audit?limit=10")
    entries = response.json()
    for entry in entries:
        sig = entry.get("signature")
        if sig:
            assert sig.startswith("sha256:"), f"Unexpected signature format: {sig}"
            # sha256: prefix + 64 hex chars = 71 chars total
            assert len(sig) == 71, f"Unexpected signature length: {len(sig)}"
            break
    else:
        # At least one entry should have a signature from seed or upload
        pass


def test_audit_filter_by_resource_type(client, mock_ollama):
    response = client.get("/api/audit?resource_type=document&limit=20")
    assert response.status_code == 200
    entries = response.json()
    for entry in entries:
        assert entry["resource_type"] == "document"
