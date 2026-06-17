"""Public SDK ingestion endpoints + serving the drop-in poh.js client."""
import uuid
import re
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response

from db import db
from models import CollectRequest, ConvertRequest
from scoring import score_session, decide
from sdk_script import POH_SDK_JS
import ipqs

sdk_router = APIRouter(prefix="/api", tags=["sdk"])


def now_utc():
    return datetime.now(timezone.utc)


def now_iso():
    return now_utc().isoformat()


def client_ip(request: Request) -> str:
    """Resolve the real client IP behind the ingress/CDN proxy chain."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        first = xff.split(",")[0].strip()
        if first:
            return first
    real = request.headers.get("x-real-ip", "")
    if real:
        return real.strip()
    return request.client.host if request.client else "0.0.0.0"


async def enrich_with_ip_intel(ip: str, sig: dict) -> dict | None:
    """Look up IP threat-intel (IPQS) and fold network signals into `sig`.

    Returns the raw intel dict (for forensic display) or None when disabled/private.
    Client-supplied signals are only overridden when intel reports a positive.
    """
    intel = await ipqs.get_or_fetch(ip, sig.get("user_agent"), sig.get("language"))
    if not intel:
        return None
    for key in ("proxy", "vpn", "tor", "datacenter_ip"):
        if intel.get(key):
            sig[key] = True
    return intel


def parse_ua(ua: str) -> dict:
    ua = ua or ""
    low = ua.lower()
    if "iphone" in low or "android" in low or "mobile" in low:
        device = "Mobile"
    elif "ipad" in low or "tablet" in low:
        device = "Tablet"
    else:
        device = "Desktop"
    browser = "Other"
    for name, token in [("Edge", "edg/"), ("Chrome", "chrome/"), ("Firefox", "firefox/"),
                        ("Safari", "safari/")]:
        if token in low:
            browser = name
            if name == "Safari" and "chrome/" in low:
                continue
            break
    os_name = "Other"
    for name, token in [("Windows", "windows"), ("macOS", "mac os"), ("Android", "android"),
                        ("iOS", "iphone"), ("iOS", "ipad"), ("Linux", "linux")]:
        if token in low:
            os_name = name
            break
    return {"device_type": device, "browser": browser, "os": os_name}


TZ_COUNTRY = {
    "America/New_York": ("United States", "New York"),
    "America/Chicago": ("United States", "Chicago"),
    "America/Los_Angeles": ("United States", "Los Angeles"),
    "Europe/London": ("United Kingdom", "London"),
    "Europe/Berlin": ("Germany", "Berlin"),
    "Asia/Kolkata": ("India", "Mumbai"),
    "Asia/Singapore": ("Singapore", "Singapore"),
}


async def _resolve_site(sdk_key: str):
    site = await db.sites.find_one({"sdk_key": sdk_key}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=404, detail="Invalid SDK key")
    return site


async def _recurrence(workspace_id: str, fingerprint: str) -> int:
    if not fingerprint:
        return 0
    since = (now_utc() - timedelta(hours=1)).isoformat()
    return await db.sessions.count_documents({
        "workspace_id": workspace_id,
        "fingerprint_hash": fingerprint,
        "started_at": {"$gte": since},
    })


@sdk_router.get("/poh.js")
async def serve_sdk():
    return Response(content=POH_SDK_JS, media_type="application/javascript",
                    headers={"Cache-Control": "public, max-age=300"})


@sdk_router.post("/collect")
async def collect(body: CollectRequest, request: Request):
    site = await _resolve_site(body.sdk_key)
    ws_id = site["workspace_id"]
    ip = client_ip(request)
    sig = dict(body.signals or {})
    sig.setdefault("user_agent", request.headers.get("user-agent", ""))

    ip_intel = await enrich_with_ip_intel(ip, sig)

    ua_info = parse_ua(sig.get("user_agent", ""))
    tz = sig.get("timezone", "")
    country, city = TZ_COUNTRY.get(tz, ("Unknown", "Unknown"))
    # IPQS geo is authoritative over timezone heuristics when available.
    if ip_intel:
        country = ip_intel.get("country") or country
        city = ip_intel.get("city") or city

    fp = body.fingerprint or sig.get("canvas") or ""
    recurrence = await _recurrence(ws_id, fp)
    score = score_session(sig, recurrence)

    rules = await db.rules.find({"workspace_id": ws_id, "enabled": True}, {"_id": 0}).to_list(200)
    ws = await db.workspaces.find_one({"id": ws_id}, {"_id": 0})
    sensitivity = (ws or {}).get("sensitivity_profile", "balanced")
    record = {**score, "signals": sig, "source": (body.utm or {}).get("source") or "direct",
              "country": country}
    decision = decide(record, rules, sensitivity)

    utm = body.utm or {}
    session_id = body.session_id or str(uuid.uuid4())
    doc = {
        "workspace_id": ws_id,
        "site_id": site["id"],
        "session_id": session_id,
        "ip": ip,
        "country": country,
        "city": city,
        "device_type": ua_info["device_type"],
        "os": ua_info["os"],
        "browser": ua_info["browser"],
        "user_agent": sig.get("user_agent", ""),
        "source": utm.get("source") or "direct",
        "medium": utm.get("medium") or ("referral" if body.referrer else "none"),
        "campaign": utm.get("campaign") or "(not set)",
        "ad_set": utm.get("content") or "",
        "keyword": utm.get("term") or "",
        "landing_page": body.page or "",
        "referrer": body.referrer or "",
        "fingerprint_hash": fp,
        "signals": sig,
        "ip_intel": ip_intel,
        "recurrence": recurrence,
        "trust_score": score["trust_score"],
        "fraud_score": score["fraud_score"],
        "confidence": score["confidence"],
        "classification": score["classification"],
        "reason_codes": score["reason_codes"],
        "action": decision["action"],
        "triggered_rule": decision.get("rule_name"),
        "cost": 1.2 if (utm.get("medium") in ("cpc", "paid_social", "paid")) else 0,
        "is_live": True,
        "updated_at": now_iso(),
    }

    existing = await db.sessions.find_one({"workspace_id": ws_id, "session_id": session_id}, {"_id": 0, "id": 1, "started_at": 1, "events_count": 1})
    if existing:
        doc["events_count"] = existing.get("events_count", 1) + 1
        await db.sessions.update_one({"workspace_id": ws_id, "session_id": session_id}, {"$set": doc})
        sess_id = existing["id"]
    else:
        doc["id"] = str(uuid.uuid4())
        doc["started_at"] = now_iso()
        doc["events_count"] = 1
        await db.sessions.insert_one(doc)
        sess_id = doc["id"]

    return {"session_id": session_id, "score": score, "action": decision["action"], "id": sess_id}


@sdk_router.post("/convert")
async def convert(body: ConvertRequest, request: Request):
    site = await _resolve_site(body.sdk_key)
    ws_id = site["workspace_id"]
    sig = dict(body.signals or {})
    sig.setdefault("user_agent", request.headers.get("user-agent", ""))
    await enrich_with_ip_intel(client_ip(request), sig)
    fp = body.fingerprint or sig.get("canvas") or ""
    recurrence = await _recurrence(ws_id, fp)
    score = score_session(sig, recurrence)

    rules = await db.rules.find({"workspace_id": ws_id, "enabled": True}, {"_id": 0}).to_list(200)
    ws = await db.workspaces.find_one({"id": ws_id}, {"_id": 0})
    sensitivity = (ws or {}).get("sensitivity_profile", "balanced")
    record = {**score, "signals": sig}
    decision = decide(record, rules, sensitivity)
    action = decision["action"]
    status = "blocked" if action == "block" else "review" if action == "review" else "accepted"

    utm = body.utm or {}
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": ws_id,
        "site_id": site["id"],
        "session_id": body.session_id or "",
        "type": body.type,
        "value": body.value,
        "currency": body.currency,
        "source": utm.get("source") or "direct",
        "campaign": utm.get("campaign") or "(not set)",
        "fingerprint_hash": fp,
        "trust_score": score["trust_score"],
        "fraud_score": score["fraud_score"],
        "confidence": score["confidence"],
        "classification": score["classification"],
        "reason_codes": score["reason_codes"],
        "status": status,
        "action": action,
        "is_live": True,
        "created_at": now_iso(),
    }
    await db.conversions.insert_one(doc)
    return {"status": status, "score": score, "id": doc["id"]}
