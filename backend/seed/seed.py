"""
seed.py — Idempotent database seeding.
Creates schema, loads seed documents, embeds them, creates CAPAs and timeline events,
builds the knowledge graph. Safe to run multiple times.
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

log = logging.getLogger("qms.seed")

DOCS_DIR = Path(__file__).parent / "docs"

# -----------------------------------------------------------------------
# Document metadata catalog — matched to the seed document files
# -----------------------------------------------------------------------
SEED_DOCUMENTS = [
    {
        "file": "SOP-2024-031_fiber_draw_process_control.txt",
        "doc_number": "SOP-2024-031",
        "title": "Optical Fiber Draw Process Control",
        "doc_type": "SOP",
        "version": "4.2",
        "author": "Dr. Sarah Chen",
        "department": "Fiber Optics",
        "regulatory_refs": [
            "ISO 9001:2015 §8.6",
            "IEC 60793-2-50",
            "FDA 21 CFR 820.80",
            "IATF 16949 §8.5",
        ],
        "status": "Active",
        "ai_score": 0.96,
        "last_review": date(2024, 11, 15),
        "next_review": date(2025, 5, 15),
    },
    {
        "file": "SOP-2024-028_glass_substrate_cleaning.txt",
        "doc_number": "SOP-2024-028",
        "title": "Glass Substrate Cleaning Procedure",
        "doc_type": "SOP",
        "version": "2.1",
        "author": "Rebecca Hoffman",
        "department": "Display Glass",
        "regulatory_refs": ["ISO 14644-1", "ISO 9001:2015 §8.5.1"],
        "status": "Active",
        "ai_score": 0.91,
        "last_review": date(2024, 9, 10),
        "next_review": date(2025, 3, 10),
    },
    {
        "file": "SOP-2024-019_fusion_draw_calibration.txt",
        "doc_number": "SOP-2024-019",
        "title": "Fusion Draw Machine Calibration",
        "doc_type": "SOP",
        "version": "3.0",
        "author": "Dr. Li Wei",
        "department": "Display Glass",
        "regulatory_refs": ["IATF 16949 §7.1.5", "ISO 9001:2015 §7.1.5"],
        "status": "Active",
        "ai_score": 0.89,
        "last_review": date(2024, 7, 22),
        "next_review": date(2025, 1, 22),
    },
    {
        "file": "WI-4420_borosilicate_batch_mixing.txt",
        "doc_number": "WI-4420",
        "title": "Borosilicate Glass Batch Mixing",
        "doc_type": "Work Instruction",
        "version": "2.3",
        "author": "Dr. Li Wei",
        "department": "Glass Melting",
        "regulatory_refs": ["ISO 9001:2015 §8.5.1"],
        "status": "Active",
        "ai_score": 0.93,
        "last_review": date(2024, 8, 5),
        "next_review": date(2025, 2, 5),
    },
    {
        "file": "WI-4455_fiber_preform_deposition.txt",
        "doc_number": "WI-4455",
        "title": "Fiber Preform Deposition Parameters",
        "doc_type": "Work Instruction",
        "version": "1.8",
        "author": "Dr. Li Wei",
        "department": "Fiber Optics",
        "regulatory_refs": ["ISO 9001:2015 §8.5.1", "IEC 60793-1-1"],
        "status": "Active",
        "ai_score": 0.94,
        "last_review": date(2024, 10, 1),
        "next_review": date(2025, 4, 1),
    },
    {
        "file": "WI-4398_antireflective_coating.txt",
        "doc_number": "WI-4398",
        "title": "Anti-Reflective Coating Application",
        "doc_type": "Work Instruction",
        "version": "3.1",
        "author": "Rebecca Hoffman",
        "department": "Optical Coatings",
        "regulatory_refs": ["ISO 9001:2015 §8.5.1"],
        "status": "Under Review",
        "ai_score": 0.88,
        "last_review": date(2024, 9, 25),
        "next_review": date(2025, 1, 19),
    },
    {
        "file": "CAPA-089_fiber_draw_tension_deviation.txt",
        "doc_number": "CAPA-089",
        "title": "Fiber Draw Tension Deviation — Line 3",
        "doc_type": "CAPA",
        "version": "1.2",
        "author": "James Rodriguez",
        "department": "Fiber Optics",
        "regulatory_refs": ["ISO 9001:2015 §10.2"],
        "status": "In Progress",
        "ai_score": 0.87,
        "last_review": date(2024, 11, 29),
        "next_review": date(2025, 1, 15),
    },
    {
        "file": "CAPA-087_substrate_thickness_variation.txt",
        "doc_number": "CAPA-087",
        "title": "Substrate Thickness Variation — Supplier B",
        "doc_type": "CAPA",
        "version": "1.1",
        "author": "Michael Torres",
        "department": "Supply Chain Quality",
        "regulatory_refs": ["ISO 9001:2015 §10.2", "ISO 9001:2015 §8.4.1"],
        "status": "Open",
        "ai_score": 0.85,
        "last_review": date(2024, 10, 15),
        "next_review": date(2025, 2, 28),
    },
    {
        "file": "NCR-2024-156_refractive_index_batch7842.txt",
        "doc_number": "NCR-2024-156",
        "title": "Out-of-Spec Refractive Index — Batch 7842",
        "doc_type": "NCR",
        "version": "1.1",
        "author": "Michael Torres",
        "department": "Supply Chain Quality",
        "regulatory_refs": ["ISO 9001:2015 §8.7"],
        "status": "Open",
        "ai_score": 0.92,
        "last_review": date(2024, 11, 30),
        "next_review": date(2024, 12, 14),
    },
    {
        "file": "NCR-2024-141_surface_defect_gorilla_lot22b.txt",
        "doc_number": "NCR-2024-141",
        "title": "Surface Defect — Gorilla Glass Lot 22B",
        "doc_type": "NCR",
        "version": "1.2",
        "author": "Michael Torres",
        "department": "Supply Chain Quality",
        "regulatory_refs": ["ISO 9001:2015 §8.7"],
        "status": "Closed",
        "ai_score": 0.90,
        "last_review": date(2024, 11, 20),
        "next_review": None,
    },
    {
        "file": "AR-2024-Q3_internal_audit_fiber_division.txt",
        "doc_number": "AR-2024-Q3",
        "title": "Q3 2024 Internal Audit — Fiber Division",
        "doc_type": "Audit Report",
        "version": "1.0",
        "author": "Dr. Sarah Chen",
        "department": "Quality",
        "regulatory_refs": ["ISO 9001:2015 §9.2", "IATF 16949 §9.2"],
        "status": "Final",
        "ai_score": 0.95,
        "last_review": date(2024, 9, 20),
        "next_review": None,
    },
    {
        "file": "TR-2024-015_fdm_operator_training.txt",
        "doc_number": "TR-2024-015",
        "title": "FDM Operator Training Record",
        "doc_type": "Training Record",
        "version": "1.4",
        "author": "Dr. Sarah Chen",
        "department": "Human Resources",
        "regulatory_refs": ["ISO 9001:2015 §7.2", "IATF 16949 §7.2.1"],
        "status": "Active",
        "ai_score": 0.83,
        "last_review": date(2024, 8, 1),
        "next_review": date(2025, 2, 1),
    },
]

# -----------------------------------------------------------------------
# CAPA records to create in the capas table
# -----------------------------------------------------------------------
SEED_CAPAS = [
    {
        "capa_number": "CAPA-089",
        "title": "Fiber Draw Tension Deviation — Line 3",
        "status": "In Progress",
        "priority": "High",
        "phase": "Corrective Action",
        "owner": "James Rodriguez",
        "department": "Fiber Optics",
        "source_ncr": "NCR-2024-156",
        "description": (
            "On 2024-11-28, fiber tension on Draw Line 3 exceeded the UCL of 55g, "
            "reaching a peak of 62g. 12 spools quarantined. Yield impact $34,200. "
            "Investigation points to Zone 3 heating element degradation at 93% of rated life "
            "and undetected SPC trend by shift supervisors."
        ),
        "opened_date": date(2024, 11, 28),
        "target_close": date(2025, 1, 15),
        "timeline": [
            {
                "event_date": date(2024, 11, 28),
                "event": "Tension excursion detected by SPC system — draw stopped",
                "status": "completed",
                "ai_involved": False,
                "sort_order": 1,
            },
            {
                "event_date": date(2024, 11, 29),
                "event": "Heating element inspection performed — Zone 3 at 93% life",
                "status": "completed",
                "ai_involved": False,
                "sort_order": 2,
            },
            {
                "event_date": date(2024, 11, 29),
                "event": "CAPA opened, AI Root Cause Analysis initiated",
                "status": "completed",
                "ai_involved": True,
                "sort_order": 3,
            },
            {
                "event_date": date(2024, 12, 5),
                "event": "Zone 3 heating element replacement — scheduled",
                "status": "in_progress",
                "ai_involved": False,
                "sort_order": 4,
            },
            {
                "event_date": date(2024, 12, 15),
                "event": "SPC retraining for shift supervisors",
                "status": "pending",
                "ai_involved": False,
                "sort_order": 5,
            },
            {
                "event_date": date(2025, 1, 15),
                "event": "CAPA verification and closure",
                "status": "pending",
                "ai_involved": True,
                "sort_order": 6,
            },
        ],
    },
    {
        "capa_number": "CAPA-087",
        "title": "Substrate Thickness Variation — Supplier B (Batch Materials Co.)",
        "status": "Open",
        "priority": "Medium",
        "phase": "Root Cause Analysis",
        "owner": "Michael Torres",
        "department": "Supply Chain Quality",
        "source_ncr": "NCR-2024-141",
        "description": (
            "Incoming glass substrate Cpk from Batch Materials Co. (SUP-003) declined "
            "from 1.8 to 1.1 over 6 months. Three production delays in Q4. Scrap rate "
            "increased from 0.3% to 2.1%. Root cause: supplier changed SiO2 source without "
            "notification."
        ),
        "opened_date": date(2024, 10, 15),
        "target_close": date(2025, 2, 28),
        "timeline": [
            {
                "event_date": date(2024, 10, 15),
                "event": "CAPA opened following NCR-2024-141 and Cpk trend analysis",
                "status": "completed",
                "ai_involved": False,
                "sort_order": 1,
            },
            {
                "event_date": date(2024, 10, 18),
                "event": "SCAR-2024-014 issued to Batch Materials Co.",
                "status": "completed",
                "ai_involved": False,
                "sort_order": 2,
            },
            {
                "event_date": date(2024, 11, 1),
                "event": "Supplier response received — SiO2 source change identified",
                "status": "completed",
                "ai_involved": False,
                "sort_order": 3,
            },
            {
                "event_date": date(2024, 12, 1),
                "event": "Corrective actions implementation — AQL tightening",
                "status": "in_progress",
                "ai_involved": False,
                "sort_order": 4,
            },
            {
                "event_date": date(2025, 2, 28),
                "event": "Verification — 6 months at Cpk ≥ 1.67 required",
                "status": "pending",
                "ai_involved": False,
                "sort_order": 5,
            },
        ],
    },
]

# -----------------------------------------------------------------------
# Audit log seed entries
# -----------------------------------------------------------------------
SEED_AUDIT_ENTRIES = [
    {
        "user_name": "Dr. Sarah Chen",
        "user_role": "Quality Director",
        "action": "UPLOAD",
        "resource_type": "document",
        "resource_name": "SOP-2024-031 v4.2",
        "ai_involved": True,
        "ai_model": "nomic-embed-text",
        "details": {"chunk_count": 23},
    },
    {
        "user_name": "AI System",
        "user_role": "AI",
        "action": "EMBED",
        "resource_type": "document",
        "resource_name": "SOP-2024-031",
        "ai_involved": True,
        "ai_model": "nomic-embed-text",
        "details": {"chunks_embedded": 23},
    },
    {
        "user_name": "James Rodriguez",
        "user_role": "Process Engineer",
        "action": "SEARCH",
        "resource_type": "search",
        "resource_name": "fiber draw tension control limits",
        "ai_involved": True,
        "ai_model": "qwen2.5:7b",
        "details": {"source_count": 4, "elapsed_ms": 1243},
    },
    {
        "user_name": "AI System",
        "user_role": "AI",
        "action": "GENERATE_RCA",
        "resource_type": "capa",
        "resource_name": "CAPA-089",
        "ai_involved": True,
        "ai_model": "qwen2.5:7b",
        "details": {"risk_score": 7, "risk_level": "High"},
    },
    {
        "user_name": "Dr. Sarah Chen",
        "user_role": "Quality Director",
        "action": "APPROVE",
        "resource_type": "document",
        "resource_name": "SOP-2024-031 v4.2",
        "ai_involved": False,
        "details": {"version": "4.2", "approved": True},
    },
    {
        "user_name": "Michael Torres",
        "user_role": "Supplier Quality Engineer",
        "action": "UPLOAD",
        "resource_type": "document",
        "resource_name": "NCR-2024-156",
        "ai_involved": True,
        "ai_model": "nomic-embed-text",
        "details": {"chunk_count": 12},
    },
    {
        "user_name": "AI System",
        "user_role": "AI",
        "action": "CLASSIFY",
        "resource_type": "document",
        "resource_name": "NCR-2024-156",
        "ai_involved": True,
        "ai_model": "qwen2.5:7b",
        "details": {"entities_extracted": 8},
    },
]


async def seed():
    """Main seed function — idempotent. Only seeds if documents table is empty."""
    # Import here to avoid circular imports at module level
    import asyncpg
    from config import settings
    from services.embeddings import embed_and_store
    from services.graph_builder import build_graph
    import hashlib

    pool = await asyncpg.create_pool(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        min_size=1,
        max_size=5,
    )

    try:
        async with pool.acquire() as conn:
            count = await conn.fetchval("SELECT COUNT(*) FROM documents")

        if count and count > 0:
            log.info(f"Seed skipped — {count} documents already in DB")
            return

        log.info("Starting database seed...")

        # --- Seed documents ---
        doc_id_map = {}  # doc_number → UUID
        for doc_meta in SEED_DOCUMENTS:
            file_path = DOCS_DIR / doc_meta["file"]
            if not file_path.exists():
                log.warning(f"Seed file not found: {file_path}")
                continue

            text = file_path.read_text(encoding="utf-8")
            log.info(f"Seeding document: {doc_meta['doc_number']}")

            async with pool.acquire() as conn:
                doc_id = await conn.fetchval(
                    """
                    INSERT INTO documents
                      (doc_number, title, doc_type, version, author, department,
                       regulatory_refs, ai_score, last_review, next_review,
                       raw_text, file_name, status)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                    ON CONFLICT (doc_number) DO UPDATE
                        SET title = EXCLUDED.title
                    RETURNING id
                    """,
                    doc_meta["doc_number"],
                    doc_meta["title"],
                    doc_meta["doc_type"],
                    doc_meta["version"],
                    doc_meta["author"],
                    doc_meta["department"],
                    doc_meta.get("regulatory_refs"),
                    doc_meta.get("ai_score"),
                    doc_meta.get("last_review"),
                    doc_meta.get("next_review"),
                    text,
                    doc_meta["file"],
                    doc_meta.get("status", "Active"),
                )
            doc_id_map[doc_meta["doc_number"]] = doc_id

            # Embed chunks
            try:
                chunk_count = await embed_and_store(pool, doc_id, text)
                log.info(
                    f"  Embedded {chunk_count} chunks for {doc_meta['doc_number']}"
                )
            except Exception as e:
                log.warning(f"  Embedding failed for {doc_meta['doc_number']}: {e}")

        log.info("Documents seeded")

        # --- Seed CAPAs ---
        for capa_meta in SEED_CAPAS:
            log.info(f"Seeding CAPA: {capa_meta['capa_number']}")

            # Try to link to source doc
            source_doc_id = None
            source_ncr = capa_meta.get("source_ncr")
            if source_ncr and source_ncr in doc_id_map:
                source_doc_id = doc_id_map[source_ncr]

            async with pool.acquire() as conn:
                capa_id = await conn.fetchval(
                    """
                    INSERT INTO capas
                      (capa_number, title, status, priority, phase, owner, department,
                       source_doc_id, source_ncr, description, opened_date, target_close)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                    ON CONFLICT (capa_number) DO UPDATE
                        SET title = EXCLUDED.title
                    RETURNING id
                    """,
                    capa_meta["capa_number"],
                    capa_meta["title"],
                    capa_meta["status"],
                    capa_meta["priority"],
                    capa_meta["phase"],
                    capa_meta["owner"],
                    capa_meta["department"],
                    source_doc_id,
                    source_ncr,
                    capa_meta["description"],
                    capa_meta["opened_date"],
                    capa_meta["target_close"],
                )

                # Timeline events
                for i, evt in enumerate(capa_meta.get("timeline", [])):
                    await conn.execute(
                        """
                        INSERT INTO capa_timeline
                          (capa_id, event_date, event, status, ai_involved, sort_order)
                        VALUES ($1,$2,$3,$4,$5,$6)
                        ON CONFLICT DO NOTHING
                        """,
                        capa_id,
                        evt["event_date"],
                        evt["event"],
                        evt["status"],
                        evt["ai_involved"],
                        evt["sort_order"],
                    )

        log.info("CAPAs seeded")

        # --- Seed audit log ---
        now = datetime.now(timezone.utc)
        for i, entry in enumerate(SEED_AUDIT_ENTRIES):
            ts_offset = now.replace(microsecond=0)
            import datetime as dt_module

            ts = ts_offset - dt_module.timedelta(hours=len(SEED_AUDIT_ENTRIES) - i)
            rid = ""
            raw = f"{ts.isoformat()}|system|{entry['action']}|{rid}"
            sig = "sha256:" + hashlib.sha256(raw.encode()).hexdigest()

            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO audit_log
                      (timestamp, user_id, user_name, user_role, action,
                       resource_type, resource_name,
                       ai_involved, ai_model, details, signature)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                    """,
                    ts,
                    "system",
                    entry["user_name"],
                    entry.get("user_role"),
                    entry["action"],
                    entry.get("resource_type"),
                    entry.get("resource_name"),
                    entry.get("ai_involved", False),
                    entry.get("ai_model"),
                    json.dumps(entry.get("details", {})),
                    sig,
                )

        log.info("Audit log seeded")

        # --- Build knowledge graph ---
        try:
            await build_graph(pool)
            log.info("Knowledge graph built")
        except Exception as e:
            log.warning(f"Graph build failed: {e}")

        log.info("Seed complete!")

    finally:
        await pool.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())
