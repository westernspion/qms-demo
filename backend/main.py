"""
main.py — FastAPI application entry point.
Registers routers, handles lifespan (DB init, Ollama wait, seed).
"""

import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import init_db, close_db
from routers import health, documents, search, capas, audit, graph

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("qms")


async def _wait_for_ollama(max_retries: int = 24, delay: float = 5.0) -> None:
    """Poll Ollama until it responds or we give up (2 minutes)."""
    url = f"{settings.ollama_host}/api/tags"
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(url)
                if r.status_code == 200:
                    log.info("Ollama is ready")
                    return
        except Exception:
            pass
        log.info(f"Waiting for Ollama... ({attempt + 1}/{max_retries})")
        await asyncio.sleep(delay)
    log.warning("Ollama did not become ready in time — continuing anyway")


async def _pull_models() -> None:
    """Pull required models if not already present."""
    models_to_pull = [settings.embed_model, settings.llm_model]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{settings.ollama_host}/api/tags")
            if r.status_code == 200:
                present = {m["name"] for m in r.json().get("models", [])}
                for model in models_to_pull:
                    # Ollama tags include :latest suffix sometimes
                    variants = {model, f"{model}:latest"}
                    if not present.intersection(variants):
                        log.info(f"Pulling model: {model}")
                        async with httpx.AsyncClient(timeout=300) as pull_client:
                            await pull_client.post(
                                f"{settings.ollama_host}/api/pull",
                                json={"name": model},
                            )
                        log.info(f"Pulled: {model}")
                    else:
                        log.info(f"Model already present: {model}")
    except Exception as e:
        log.warning(f"Could not pull models: {e}")


async def _run_seed() -> None:
    """Run idempotent seed if documents table is empty."""
    try:
        from seed.seed import seed

        await seed()
    except Exception as e:
        log.warning(f"Seed skipped or failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting QMS backend...")
    await init_db()
    log.info("Database initialised")

    await _wait_for_ollama()
    await _pull_models()
    await _run_seed()

    log.info("QMS backend ready")
    yield

    await close_db()
    log.info("QMS backend shut down")


app = FastAPI(
    title="Apex Glass Technologies — AI-Native QMS",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers — all under /api prefix
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(capas.router, prefix="/api", tags=["capas"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(graph.router, prefix="/api", tags=["graph"])
