"""
services/graph_builder.py — Build knowledge graph nodes/edges from documents + CAPAs.
Extracts relationships and populates graph_nodes + graph_edges tables.
"""

import asyncpg


# Prefix → group_key mapping
DOC_TYPE_TO_GROUP = {
    "SOP": "sop",
    "Work Instruction": "wi",
    "CAPA": "capa",
    "NCR": "ncr",
    "Audit Report": "audit",
    "Training Record": "training",
    "Risk Assessment": "risk",
}

# Node size by type (connectivity hint)
NODE_SIZES = {
    "sop": 18,
    "wi": 15,
    "capa": 16,
    "ncr": 14,
    "person": 12,
    "process": 13,
    "regulation": 14,
    "supplier": 13,
    "audit": 12,
    "training": 11,
}

# Static process/regulation/person nodes for Apex Glass domain
STATIC_NODES = [
    # Processes
    {
        "node_key": "process:fiber-draw",
        "label": "Fiber Draw Process",
        "node_type": "process",
        "group_key": "process",
    },
    {
        "node_key": "process:batch-mixing",
        "label": "Batch Mixing",
        "node_type": "process",
        "group_key": "process",
    },
    {
        "node_key": "process:substrate-cleaning",
        "label": "Substrate Cleaning",
        "node_type": "process",
        "group_key": "process",
    },
    {
        "node_key": "process:ar-coating",
        "label": "AR Coating",
        "node_type": "process",
        "group_key": "process",
    },
    {
        "node_key": "process:fdm-calibration",
        "label": "FDM Calibration",
        "node_type": "process",
        "group_key": "process",
    },
    # Regulations
    {
        "node_key": "reg:iso9001",
        "label": "ISO 9001:2015",
        "node_type": "regulation",
        "group_key": "regulation",
    },
    {
        "node_key": "reg:iec60793",
        "label": "IEC 60793-2-50",
        "node_type": "regulation",
        "group_key": "regulation",
    },
    {
        "node_key": "reg:fda21cfr820",
        "label": "FDA 21 CFR 820",
        "node_type": "regulation",
        "group_key": "regulation",
    },
    {
        "node_key": "reg:iatf16949",
        "label": "IATF 16949",
        "node_type": "regulation",
        "group_key": "regulation",
    },
    {
        "node_key": "reg:iso14644",
        "label": "ISO 14644-1",
        "node_type": "regulation",
        "group_key": "regulation",
    },
    # People
    {
        "node_key": "person:sarah-chen",
        "label": "Dr. Sarah Chen",
        "node_type": "person",
        "group_key": "person",
    },
    {
        "node_key": "person:james-rodriguez",
        "label": "James Rodriguez",
        "node_type": "person",
        "group_key": "person",
    },
    {
        "node_key": "person:michael-torres",
        "label": "Michael Torres",
        "node_type": "person",
        "group_key": "person",
    },
    {
        "node_key": "person:li-wei",
        "label": "Dr. Li Wei",
        "node_type": "person",
        "group_key": "person",
    },
    {
        "node_key": "person:rebecca-hoffman",
        "label": "Rebecca Hoffman",
        "node_type": "person",
        "group_key": "person",
    },
    # Suppliers
    {
        "node_key": "supplier:silica-source",
        "label": "Silica Source Inc.",
        "node_type": "supplier",
        "group_key": "supplier",
    },
    {
        "node_key": "supplier:batch-materials",
        "label": "Batch Materials Co.",
        "node_type": "supplier",
        "group_key": "supplier",
    },
]

# Static edges that encode known relationships
STATIC_EDGES = [
    # SOPs govern processes
    ("SOP-2024-031", "process:fiber-draw", "controls"),
    ("SOP-2024-028", "process:substrate-cleaning", "controls"),
    ("SOP-2024-019", "process:fdm-calibration", "controls"),
    # WIs instruct processes
    ("WI-4420", "process:batch-mixing", "instructs"),
    ("WI-4455", "process:fiber-draw", "instructs"),
    ("WI-4398", "process:ar-coating", "instructs"),
    # Regulations govern SOPs
    ("reg:iso9001", "SOP-2024-031", "governs"),
    ("reg:iec60793", "SOP-2024-031", "governs"),
    ("reg:fda21cfr820", "SOP-2024-031", "governs"),
    ("reg:iatf16949", "SOP-2024-019", "governs"),
    ("reg:iso14644", "SOP-2024-028", "governs"),
    # CAPAs triggered by NCRs
    ("CAPA-089", "NCR-2024-156", "triggered"),
    ("CAPA-087", "NCR-2024-141", "triggered"),
    # NCRs reference SOPs/WIs
    ("NCR-2024-156", "SOP-2024-031", "references"),
    ("NCR-2024-141", "SOP-2024-028", "references"),
    # People own documents/CAPAs
    ("person:sarah-chen", "SOP-2024-031", "owns"),
    ("person:james-rodriguez", "CAPA-089", "owns"),
    ("person:michael-torres", "CAPA-087", "owns"),
    ("person:li-wei", "WI-4455", "owns"),
    ("person:rebecca-hoffman", "WI-4398", "owns"),
    # Suppliers sourced for NCRs
    ("supplier:silica-source", "NCR-2024-156", "sourced"),
    ("supplier:batch-materials", "NCR-2024-141", "sourced"),
    # Cross-references between SOPs and WIs
    ("SOP-2024-031", "WI-4455", "references"),
    ("SOP-2024-031", "WI-4420", "references"),
    # Audit references
    ("AR-2024-Q3", "SOP-2024-031", "audited"),
    ("AR-2024-Q3", "reg:iso9001", "references"),
    # Training references
    ("TR-2024-015", "SOP-2024-019", "references"),
]


async def build_graph(pool: asyncpg.Pool) -> None:
    """Populate graph_nodes and graph_edges from documents, CAPAs, and static data."""
    async with pool.acquire() as conn:
        # Insert static nodes (persons, processes, regulations, suppliers)
        for node in STATIC_NODES:
            size = NODE_SIZES.get(node["group_key"], 12)
            await conn.execute(
                """
                INSERT INTO graph_nodes (node_key, label, node_type, group_key, size)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (node_key) DO UPDATE
                    SET label = EXCLUDED.label,
                        node_type = EXCLUDED.node_type,
                        group_key = EXCLUDED.group_key,
                        size = EXCLUDED.size
                """,
                node["node_key"],
                node["label"],
                node["node_type"],
                node["group_key"],
                size,
            )

        # Insert document nodes from DB
        docs = await conn.fetch("SELECT doc_number, title, doc_type FROM documents")
        for doc in docs:
            group = DOC_TYPE_TO_GROUP.get(doc["doc_type"], "document")
            size = NODE_SIZES.get(group, 12)
            await conn.execute(
                """
                INSERT INTO graph_nodes (node_key, label, node_type, group_key, size)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (node_key) DO UPDATE
                    SET label = EXCLUDED.label,
                        node_type = EXCLUDED.node_type,
                        group_key = EXCLUDED.group_key,
                        size = EXCLUDED.size
                """,
                doc["doc_number"],
                doc["doc_number"],
                "document",
                group,
                size,
            )

        # Insert edges — only if both nodes exist
        for src, tgt, rel in STATIC_EDGES:
            src_exists = await conn.fetchval(
                "SELECT 1 FROM graph_nodes WHERE node_key = $1", src
            )
            tgt_exists = await conn.fetchval(
                "SELECT 1 FROM graph_nodes WHERE node_key = $1", tgt
            )
            if src_exists and tgt_exists:
                await conn.execute(
                    """
                    INSERT INTO graph_edges (source_key, target_key, relationship, ai_extracted)
                    VALUES ($1, $2, $3, false)
                    ON CONFLICT DO NOTHING
                    """,
                    src,
                    tgt,
                    rel,
                )
