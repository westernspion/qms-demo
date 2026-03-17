"""
test_capas.py — Tests for CAPA CRUD and AI analysis endpoint.
"""

import pytest
from datetime import date


CAPA_PAYLOAD = {
    "capa_number": "TEST-CAPA-001",
    "title": "Test Root Cause Analysis CAPA",
    "priority": "High",
    "owner": "Test Engineer",
    "department": "Test Dept",
    "source_ncr": "TEST-NCR-001",
    "description": (
        "Fiber draw tension exceeded UCL of 55g. Peak reading was 62g. "
        "12 spools quarantined. Heating element Zone 3 at 93% of rated life. "
        "SPC trend not actioned."
    ),
    "opened_date": "2024-11-28",
    "target_close": "2025-01-15",
}


@pytest.fixture
def created_capa(client, mock_ollama):
    response = client.post("/api/capas", json=CAPA_PAYLOAD)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_capa_returns_201(client, mock_ollama):
    # Use unique capa_number per test
    payload = {**CAPA_PAYLOAD, "capa_number": "TEST-CAPA-CREATE-001"}
    response = client.post("/api/capas", json=payload)
    assert response.status_code == 201


def test_create_capa_has_id(created_capa):
    assert "id" in created_capa
    assert created_capa["id"] is not None


def test_list_capas_contains_created(client, mock_ollama, created_capa):
    response = client.get("/api/capas")
    assert response.status_code == 200
    numbers = [c["capa_number"] for c in response.json()]
    assert created_capa["capa_number"] in numbers


def test_get_capa_detail(client, mock_ollama, created_capa):
    capa_id = created_capa["id"]
    response = client.get(f"/api/capas/{capa_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["capa_number"] == created_capa["capa_number"]
    assert "timeline" in data
    assert "description" in data


def test_get_capa_404(client, mock_ollama):
    fake_id = "00000000-0000-0000-0000-000000000002"
    response = client.get(f"/api/capas/{fake_id}")
    assert response.status_code == 404


def test_analyze_capa_returns_rca(client, mock_ollama, created_capa):
    capa_id = created_capa["id"]
    response = client.post(f"/api/capas/{capa_id}/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "root_cause" in data
    assert "corrective_actions" in data
    assert isinstance(data["corrective_actions"], list)
    assert len(data["corrective_actions"]) >= 1


def test_analyze_capa_has_all_required_fields(client, mock_ollama, created_capa):
    capa_id = created_capa["id"]
    response = client.post(f"/api/capas/{capa_id}/analyze")
    data = response.json()
    required = [
        "root_cause",
        "root_cause_confidence",
        "corrective_actions",
        "corrective_confidence",
        "preventive_actions",
        "preventive_confidence",
        "risk_severity",
        "risk_likelihood",
        "risk_level",
        "risk_score",
        "risk_confidence",
        "customer_impact",
        "regulatory_impact",
    ]
    for field in required:
        assert field in data, f"Missing field: {field}"


def test_analyze_capa_creates_audit_entry(client, mock_ollama, created_capa):
    capa_id = created_capa["id"]
    client.post(f"/api/capas/{capa_id}/analyze")
    audit_r = client.get("/api/audit?action=GENERATE_RCA&limit=20")
    entries = audit_r.json()
    assert any(e["action"] == "GENERATE_RCA" for e in entries)


def test_analyze_capa_risk_score_integer(client, mock_ollama, created_capa):
    capa_id = created_capa["id"]
    response = client.post(f"/api/capas/{capa_id}/analyze")
    data = response.json()
    assert isinstance(data["risk_score"], int)
    assert 1 <= data["risk_score"] <= 10


def test_patch_capa_status(client, mock_ollama, created_capa):
    capa_id = created_capa["id"]
    response = client.patch(f"/api/capas/{capa_id}", json={"status": "In Progress"})
    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"
