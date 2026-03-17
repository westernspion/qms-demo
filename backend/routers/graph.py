"""
routers/graph.py — GET /api/graph — return nodes and edges for D3.
"""

import asyncpg
from fastapi import APIRouter, Depends

from db import get_pool
from schemas import GraphResponse, GraphNode, GraphEdge

router = APIRouter()


@router.get("/graph", response_model=GraphResponse)
async def get_graph(pool: asyncpg.Pool = Depends(get_pool)):
    async with pool.acquire() as conn:
        node_rows = await conn.fetch(
            "SELECT node_key, label, node_type, group_key, size, metadata FROM graph_nodes"
        )
        edge_rows = await conn.fetch(
            "SELECT source_key, target_key, relationship, weight, ai_extracted FROM graph_edges"
        )

    nodes = []
    for r in node_rows:
        import json

        meta = r["metadata"]
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                meta = {}
        nodes.append(
            GraphNode(
                node_key=r["node_key"],
                label=r["label"],
                node_type=r["node_type"],
                group_key=r["group_key"],
                size=r["size"] or 12,
                metadata=meta or {},
            )
        )

    edges = [
        GraphEdge(
            source_key=r["source_key"],
            target_key=r["target_key"],
            relationship=r["relationship"],
            weight=float(r["weight"] or 1.0),
            ai_extracted=bool(r["ai_extracted"]),
        )
        for r in edge_rows
    ]

    return GraphResponse(nodes=nodes, edges=edges)
