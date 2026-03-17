"""
test_documents.py — Tests for document upload, list, detail, and AI analyze.
"""

import io
import pytest


SAMPLE_DOC_TEXT = """STANDARD OPERATING PROCEDURE
Document Number: TEST-SOP-001
Title: Test Fiber Draw Control

1. PURPOSE
This procedure controls fiber draw tension at UCL 55g, target 50g.
Critical parameters: draw temperature 2050°C ± 15°C, speed 22 m/s.

2. REQUIREMENTS
Operators must hold Level 2 certification per TR-2024-015.
Reference: ISO 9001:2015 §8.6, SOP-2024-031.

3. ESCALATION
Any tension reading exceeding 62g requires immediate NCR initiation within 4 hours.
"""


@pytest.fixture
def uploaded_doc(client, mock_ollama, tmp_path):
    """Fixture that uploads a test document and returns the response data."""
    file_bytes = SAMPLE_DOC_TEXT.encode("utf-8")
    response = client.post(
        "/api/documents/upload",
        files={"file": ("test_sop.txt", io.BytesIO(file_bytes), "text/plain")},
        data={
            "doc_number": "TEST-SOP-001",
            "title": "Test Fiber Draw Control",
            "doc_type": "SOP",
            "version": "1.0",
            "author": "Test Author",
            "department": "Test Department",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_upload_returns_chunk_count(uploaded_doc):
    assert "chunk_count" in uploaded_doc
    assert uploaded_doc["chunk_count"] > 0


def test_upload_returns_doc_number(uploaded_doc):
    assert uploaded_doc["doc_number"] == "TEST-SOP-001"


def test_upload_status_embedded(uploaded_doc):
    assert uploaded_doc["status"] == "embedded"


def test_list_documents_contains_upload(client, mock_ollama, uploaded_doc):
    response = client.get("/api/documents")
    assert response.status_code == 200
    docs = response.json()
    numbers = [d["doc_number"] for d in docs]
    assert "TEST-SOP-001" in numbers


def test_get_document_detail(client, mock_ollama, uploaded_doc):
    doc_id = uploaded_doc["id"]
    response = client.get(f"/api/documents/{doc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["doc_number"] == "TEST-SOP-001"
    assert data["title"] == "Test Fiber Draw Control"
    assert "chunk_count" in data
    assert data["chunk_count"] > 0


def test_get_document_404(client, mock_ollama):
    fake_id = "00000000-0000-0000-0000-000000000001"
    response = client.get(f"/api/documents/{fake_id}")
    assert response.status_code == 404


def test_upload_duplicate_rejected(client, mock_ollama, uploaded_doc):
    file_bytes = b"Duplicate content"
    response = client.post(
        "/api/documents/upload",
        files={"file": ("dup.txt", io.BytesIO(file_bytes), "text/plain")},
        data={
            "doc_number": "TEST-SOP-001",  # same doc_number
            "title": "Duplicate",
            "doc_type": "SOP",
            "version": "1.0",
        },
    )
    assert response.status_code == 409


def test_upload_creates_audit_log(client, mock_ollama, uploaded_doc):
    response = client.get("/api/audit?action=UPLOAD")
    assert response.status_code == 200
    entries = response.json()
    resource_names = [e.get("resource_name", "") for e in entries]
    assert any("TEST-SOP-001" in n for n in resource_names)


def test_analyze_document(client, mock_ollama, uploaded_doc):
    doc_id = uploaded_doc["id"]
    response = client.post(f"/api/documents/{doc_id}/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "entities" in data
    assert "document_id" in data
    assert "analyzed_at" in data
