"""
test_graph.py — Tests for GET /api/graph
"""

import io
import pytest
from services.graph_builder import build_graph


@pytest.fixture(scope="module", autouse=True)
def seed_graph(client, mock_ollama, test_db_pool):
    """Upload some docs and build graph before testing."""
    # Upload a doc to ensure graph has document nodes
    client.post(
        "/api/documents/upload",
        files={
            "file": (
                "graph_test.txt",
                io.BytesIO(b"Graph test SOP-2024-031 ISO 9001 fiber draw"),
                "text/plain",
            )
        },
        data={
            "doc_number": "GRAPH-TEST-001",
            "title": "Graph Test Document",
            "doc_type": "SOP",
            "version": "1.0",
            "author": "Test",
            "department": "Test",
        },
    )

    import asyncio

    asyncio.get_event_loop().run_until_complete(build_graph(test_db_pool))


def test_graph_returns_nodes_and_edges(client, mock_ollama):
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data


def test_graph_nodes_not_empty(client, mock_ollama):
    response = client.get("/api/graph")
    data = response.json()
    assert len(data["nodes"]) > 0


def test_graph_nodes_have_required_fields(client, mock_ollama):
    response = client.get("/api/graph")
    nodes = response.json()["nodes"]
    assert len(nodes) > 0
    required = ["node_key", "label", "node_type", "group_key", "size"]
    for node in nodes[:5]:
        for field in required:
            assert field in node, f"Node missing field: {field}"


def test_graph_includes_regulation_nodes(client, mock_ollama):
    response = client.get("/api/graph")
    nodes = response.json()["nodes"]
    node_types = {n["node_type"] for n in nodes}
    assert "regulation" in node_types


def test_graph_includes_person_nodes(client, mock_ollama):
    response = client.get("/api/graph")
    nodes = response.json()["nodes"]
    node_types = {n["node_type"] for n in nodes}
    assert "person" in node_types


def test_graph_edges_have_relationship(client, mock_ollama):
    response = client.get("/api/graph")
    edges = response.json()["edges"]
    if not edges:
        pytest.skip("No edges in graph yet")
    required = ["source_key", "target_key", "relationship"]
    for edge in edges[:5]:
        for field in required:
            assert field in edge


def test_graph_has_governs_relationship(client, mock_ollama):
    response = client.get("/api/graph")
    edges = response.json()["edges"]
    relationships = {e["relationship"] for e in edges}
    assert "governs" in relationships
