"""
test_search.py — Tests for POST /api/search (RAG SSE pipeline).
"""

import io
import json
import pytest


FIBER_DOC = """STANDARD OPERATING PROCEDURE
Document Number: SEARCH-SOP-001
Title: Search Test Fiber Draw

Fiber draw tension must be maintained at 50g target, UCL 55g.
Any tension exceeding UCL triggers nonconformance report within 4 hours.
Draw temperature: 2050°C ± 15°C.
Critical parameter: fiber diameter 125.0 μm ± 0.7 μm.
"""


@pytest.fixture(scope="module")
def search_doc(client, mock_ollama):
    """Upload a document to search against."""
    file_bytes = FIBER_DOC.encode("utf-8")
    response = client.post(
        "/api/documents/upload",
        files={"file": ("search_test.txt", io.BytesIO(file_bytes), "text/plain")},
        data={
            "doc_number": "SEARCH-SOP-001",
            "title": "Search Test Fiber Draw",
            "doc_type": "SOP",
            "version": "1.0",
            "author": "Test",
            "department": "Test",
        },
    )
    if response.status_code == 409:
        # Already exists — get existing doc list and find it
        docs_r = client.get("/api/documents")
        for d in docs_r.json():
            if d["doc_number"] == "SEARCH-SOP-001":
                return d
    assert response.status_code == 200, response.text
    return response.json()


def _collect_sse_events(response_text: str) -> list[dict]:
    events = []
    for line in response_text.splitlines():
        if line.startswith("data: "):
            try:
                events.append(json.loads(line[6:]))
            except json.JSONDecodeError:
                pass
    return events


def test_search_returns_sse_stream(client, mock_ollama, search_doc):
    """Search endpoint should return SSE content-type."""
    response = client.post(
        "/api/search",
        json={"query": "fiber draw tension UCL"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")


def test_search_includes_status_events(client, mock_ollama, search_doc):
    response = client.post(
        "/api/search",
        json={"query": "fiber draw tension limits"},
    )
    events = _collect_sse_events(response.text)
    types = [e.get("type") for e in events]
    assert "status" in types


def test_search_includes_sources_event(client, mock_ollama, search_doc):
    response = client.post(
        "/api/search",
        json={"query": "fiber draw tension limits"},
    )
    events = _collect_sse_events(response.text)
    source_events = [e for e in events if e.get("type") == "sources"]
    assert len(source_events) >= 1


def test_search_includes_done_event(client, mock_ollama, search_doc):
    response = client.post(
        "/api/search",
        json={"query": "draw temperature 2050"},
    )
    events = _collect_sse_events(response.text)
    done_events = [e for e in events if e.get("type") == "done"]
    assert len(done_events) == 1


def test_search_done_has_elapsed_ms(client, mock_ollama, search_doc):
    response = client.post(
        "/api/search",
        json={"query": "fiber diameter requirements"},
    )
    events = _collect_sse_events(response.text)
    done = next((e for e in events if e.get("type") == "done"), None)
    assert done is not None
    assert "elapsed_ms" in done
    assert done["elapsed_ms"] >= 0


def test_search_creates_audit_entry(client, mock_ollama, search_doc):
    client.post("/api/search", json={"query": "audit test query fiber tension"})
    audit_r = client.get("/api/audit?action=SEARCH&limit=10")
    assert audit_r.status_code == 200
    entries = audit_r.json()
    assert any(e["action"] == "SEARCH" for e in entries)
