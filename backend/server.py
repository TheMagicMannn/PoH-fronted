import os
import logging

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import db, client
from auth import auth_router, seed_admin
from sdk_routes import sdk_router
from dashboard_routes import api as dashboard_router
from seed import ensure_demo_seeded
import ipqs

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("poh")

app = FastAPI(title="PoH — Trust & Fraud Intelligence API")

app.include_router(auth_router)
app.include_router(sdk_router)
app.include_router(dashboard_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "poh"}


origins = os.environ.get("CORS_ORIGINS", "*").split(",")
frontend_url = os.environ.get("FRONTEND_URL")
allow_origins = [frontend_url] if frontend_url and origins == ["*"] else origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await ipqs.ensure_indexes()
    ws_id = await seed_admin()
    if ws_id:
        await ensure_demo_seeded(ws_id)
        logger.info("PoH startup complete. Demo workspace ready: %s", ws_id)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
