"""Dashboard, rules, conversions, integrations, workspace & SDK-key APIs, Blah, Blah, Blah"""
import os
import uuid
import secrets
from collections import defaultdict, Counter
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query

from db import db
from auth import get_current_user, require_role, hash_password, public_user
from models import (
    WorkspaceUpdate, InviteMemberRequest, SiteCreate, RuleCreate, RuleUpdate,
    SessionActionRequest, ConversionActionRequest, IntegrationConnect,
    InvestigationCreate, InvestigationUpdate,
)
from scoring import REASON_CODES
from seed import generate_demo_data

api = APIRouter(prefix="/api", tags=["dashboard"])

RANGE_DAYS = {"24h": 1, "7d": 7, "14d": 14, "30d": 30, "90d": 90}


def now_utc():
    return datetime.now(timezone.utc)


def now_iso():
    return now_utc().isoformat()


def cutoff_iso(rng: str) -> str:
    days = RANGE_DAYS.get(rng, 7)
    return (now_utc() - timedelta(days=days)).isoformat()


async def log_audit(workspace_id, user, action, target, details):
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()), "workspace_id": workspace_id,
        "user_name": user.get("name"), "action": action, "target": target,
        "details": details, "created_at": now_iso(),
    })


def ws_id(user):
    return user["workspace_id"]


# ---------- Overview ----------
@api.get("/overview")
async def overview(range: str = Query("7d"), user: dict = Depends(get_current_user)):
    wid = ws_id(user)
    cut = cutoff_iso(range)
    sessions = await db.sessions.find(
        {"workspace_id": wid, "started_at": {"$gte": cut}},
        {"_id": 0, "classification": 1, "fraud_score": 1, "cost": 1, "source": 1,
         "reason_codes": 1, "started_at": 1, "action": 1, "device_type": 1},
    ).to_list(20000)
    convs = await db.conversions.find(
        {"workspace_id": wid, "created_at": {"$gte": cut}},
        {"_id": 0, "classification": 1, "status": 1, "value": 1, "created_at": 1},
    ).to_list(20000)

    total = len(sessions)
    by_class = Counter(s["classification"] for s in sessions)
    wasted = round(sum(s.get("cost", 0) for s in sessions if s["classification"] != "trusted"), 2)
    blocked = sum(1 for s in sessions if s.get("action") == "block")

    # trend by day
    trend = defaultdict(lambda: {"trusted": 0, "suspicious": 0, "fraudulent": 0})
    for s in sessions:
        day = s["started_at"][:10]
        trend[day][s["classification"]] += 1
    trend_series = [{"date": d, **v} for d, v in sorted(trend.items())]

    # by source
    src = defaultdict(lambda: {"total": 0, "bad": 0, "wasted": 0.0})
    for s in sessions:
        src[s["source"]]["total"] += 1
        if s["classification"] != "trusted":
            src[s["source"]]["bad"] += 1
            src[s["source"]]["wasted"] += s.get("cost", 0)
    by_source = [
        {"source": k, "total": v["total"], "bad": v["bad"],
         "fraud_rate": round(v["bad"] / v["total"] * 100, 1) if v["total"] else 0,
         "wasted": round(v["wasted"], 2)}
        for k, v in sorted(src.items(), key=lambda x: -x[1]["bad"])
    ]

    reason_counter = Counter()
    for s in sessions:
        for rc in s.get("reason_codes", []):
            reason_counter[rc] += 1
    top_reasons = [
        {"code": c, "label": REASON_CODES.get(c, {}).get("label", c), "count": n}
        for c, n in reason_counter.most_common(6)
    ]

    total_conv = len(convs)
    invalid_conv = sum(1 for c in convs if c["classification"] != "trusted")
    suppressed = sum(1 for c in convs if c["status"] in ("suppressed", "blocked"))

    return {
        "range": range,
        "kpis": {
            "total_sessions": total,
            "trusted": by_class.get("trusted", 0),
            "suspicious": by_class.get("suspicious", 0),
            "fraudulent": by_class.get("fraudulent", 0),
            "invalid_traffic_rate": round((total - by_class.get("trusted", 0)) / total * 100, 1) if total else 0,
            "estimated_wasted_spend": wasted,
            "blocked_sessions": blocked,
            "total_conversions": total_conv,
            "invalid_conversions": invalid_conv,
            "invalid_conversion_rate": round(invalid_conv / total_conv * 100, 1) if total_conv else 0,
            "suppressed_conversions": suppressed,
        },
        "distribution": [
            {"name": "trusted", "value": by_class.get("trusted", 0)},
            {"name": "suspicious", "value": by_class.get("suspicious", 0)},
            {"name": "fraudulent", "value": by_class.get("fraudulent", 0)},
        ],
        "trend": trend_series,
        "by_source": by_source,
        "top_reasons": top_reasons,
    }


# ----------The User Sessions ----------
@api.get("/sessions")
async def list_sessions(
    classification: str = Query(None), source: str = Query(None), device: str = Query(None),
    country: str = Query(None), action: str = Query(None), search: str = Query(None),
    range: str = Query("30d"), page: int = Query(1), page_size: int = Query(25),
    user: dict = Depends(get_current_user),
):
    q = {"workspace_id": ws_id(user), "started_at": {"$gte": cutoff_iso(range)}}
    if classification:
        q["classification"] = classification
    if source:
        q["source"] = source
    if device:
        q["device_type"] = device
    if country:
        q["country"] = country
    if action:
        q["action"] = action
    if search:
        q["$or"] = [
            {"ip": {"$regex": search, "$options": "i"}},
            {"session_id": {"$regex": search, "$options": "i"}},
            {"fingerprint_hash": {"$regex": search, "$options": "i"}},
            {"campaign": {"$regex": search, "$options": "i"}},
        ]
    total = await db.sessions.count_documents(q)
    items = await db.sessions.find(q, {"_id": 0}).sort("started_at", -1) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@api.get("/sessions/{sid}")
async def get_session(sid: str, user: dict = Depends(get_current_user)):
    s = await db.sessions.find_one({"workspace_id": ws_id(user), "id": sid}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    convs = await db.conversions.find(
        {"workspace_id": ws_id(user), "session_id": s["session_id"]}, {"_id": 0}
    ).to_list(50)
    s["conversions"] = convs
    return s


@api.post("/sessions/{sid}/action")
async def session_action(sid: str, body: SessionActionRequest, user: dict = Depends(get_current_user)):
    s = await db.sessions.find_one({"workspace_id": ws_id(user), "id": sid}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    mapping = {"block": "block", "review": "review", "trust": "observe", "observe": "observe"}
    action = mapping.get(body.action, body.action)
    await db.sessions.update_one(
        {"workspace_id": ws_id(user), "id": sid},
        {"$set": {"action": action, "manual_override": True, "updated_at": now_iso()}},
    )
    await log_audit(ws_id(user), user, "session.action", s["session_id"],
                    f"Manually set action to '{action}'" + (f": {body.note}" if body.note else ""))
    return {"ok": True, "action": action}


# ---------- Traffic Conversions ----------
@api.get("/conversions")
async def list_conversions(
    status: str = Query(None), classification: str = Query(None), type: str = Query(None),
    source: str = Query(None), range: str = Query("30d"),
    page: int = Query(1), page_size: int = Query(25), user: dict = Depends(get_current_user),
):
    q = {"workspace_id": ws_id(user), "created_at": {"$gte": cutoff_iso(range)}}
    if status:
        q["status"] = status
    if classification:
        q["classification"] = classification
    if type:
        q["type"] = type
    if source:
        q["source"] = source
    total = await db.conversions.count_documents(q)
    items = await db.conversions.find(q, {"_id": 0}).sort("created_at", -1) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@api.post("/conversions/{cid}/action")
async def conversion_action(cid: str, body: ConversionActionRequest, user: dict = Depends(get_current_user)):
    c = await db.conversions.find_one({"workspace_id": ws_id(user), "id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Conversion not found")
    await db.conversions.update_one(
        {"workspace_id": ws_id(user), "id": cid},
        {"$set": {"status": body.status, "manual_override": True, "updated_at": now_iso()}},
    )
    await log_audit(ws_id(user), user, "conversion.action", f"Conversion #{cid[:6]}",
                    f"Set status to '{body.status}'" + (f": {body.note}" if body.note else ""))
    return {"ok": True, "status": body.status}


# ---------- AD Campaign quality ----------
@api.get("/campaigns")
async def campaigns(range: str = Query("30d"), user: dict = Depends(get_current_user)):
    wid = ws_id(user)
    cut = cutoff_iso(range)
    sessions = await db.sessions.find(
        {"workspace_id": wid, "started_at": {"$gte": cut}},
        {"_id": 0, "source": 1, "medium": 1, "campaign": 1, "ad_set": 1,
         "classification": 1, "cost": 1},
    ).to_list(20000)
    agg = defaultdict(lambda: {"total": 0, "trusted": 0, "suspicious": 0, "fraudulent": 0,
                               "spend": 0.0, "wasted": 0.0})
    for s in sessions:
        key = (s["source"], s.get("medium", ""), s.get("campaign", ""), s.get("ad_set", ""))
        a = agg[key]
        a["total"] += 1
        a[s["classification"]] += 1
        a["spend"] += s.get("cost", 0)
        if s["classification"] != "trusted":
            a["wasted"] += s.get("cost", 0)
    rows = []
    for (source, medium, campaign, ad_set), a in agg.items():
        rows.append({
            "source": source, "medium": medium, "campaign": campaign, "ad_set": ad_set,
            "total": a["total"], "trusted": a["trusted"], "suspicious": a["suspicious"],
            "fraudulent": a["fraudulent"],
            "fraud_rate": round((a["total"] - a["trusted"]) / a["total"] * 100, 1) if a["total"] else 0,
            "spend": round(a["spend"], 2), "wasted": round(a["wasted"], 2),
        })
    rows.sort(key=lambda r: -r["wasted"])
    return {"campaigns": rows}


# ---------- THEEE Rules ----------
@api.get("/rules")
async def list_rules(user: dict = Depends(get_current_user)):
    rules = await db.rules.find({"workspace_id": ws_id(user)}, {"_id": 0}).sort("priority", -1).to_list(200)
    return {"rules": rules}


@api.post("/rules")
async def create_rule(body: RuleCreate, user: dict = Depends(require_role("analyst"))):
    rule = {
        "id": str(uuid.uuid4()), "workspace_id": ws_id(user), "name": body.name,
        "description": body.description, "enabled": body.enabled,
        "conditions": [c.model_dump() for c in body.conditions], "action": body.action,
        "priority": body.priority, "hits": 0, "created_by": user.get("name"),
        "created_at": now_iso(),
    }
    await db.rules.insert_one(rule)
    rule.pop("_id", None)
    await log_audit(ws_id(user), user, "rule.create", body.name, "Created rule")
    return rule


@api.patch("/rules/{rid}")
async def update_rule(rid: str, body: RuleUpdate, user: dict = Depends(require_role("analyst"))):
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "conditions" in updates and updates["conditions"] is not None:
        updates["conditions"] = [c if isinstance(c, dict) else c.model_dump() for c in updates["conditions"]]
    r = await db.rules.find_one_and_update(
        {"workspace_id": ws_id(user), "id": rid}, {"$set": updates})
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")
    await log_audit(ws_id(user), user, "rule.update", r.get("name"), "Updated rule")
    updated = await db.rules.find_one({"workspace_id": ws_id(user), "id": rid}, {"_id": 0})
    return updated


@api.delete("/rules/{rid}")
async def delete_rule(rid: str, user: dict = Depends(require_role("analyst"))):
    r = await db.rules.find_one({"workspace_id": ws_id(user), "id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.rules.delete_one({"workspace_id": ws_id(user), "id": rid})
    await log_audit(ws_id(user), user, "rule.delete", r.get("name"), "Deleted rule")
    return {"ok": True}


# ---------- Investigations & clusters and so on----------
@api.get("/clusters")
async def list_clusters(user: dict = Depends(get_current_user)):
    clusters = await db.fraud_clusters.find({"workspace_id": ws_id(user)}, {"_id": 0}) \
        .sort("session_count", -1).to_list(200)
    return {"clusters": clusters}


@api.get("/investigations")
async def list_investigations(user: dict = Depends(get_current_user)):
    invs = await db.investigations.find({"workspace_id": ws_id(user)}, {"_id": 0}) \
        .sort("created_at", -1).to_list(200)
    return {"investigations": invs}


@api.post("/investigations")
async def create_investigation(body: InvestigationCreate, user: dict = Depends(require_role("analyst"))):
    inv = {
        "id": str(uuid.uuid4()), "workspace_id": ws_id(user), "title": body.title,
        "severity": body.severity, "status": "open", "assignee": user.get("name"),
        "cluster_id": body.cluster_id,
        "notes": [{"author": user.get("name"), "text": body.notes or "Investigation opened.",
                   "at": now_iso()}],
        "created_at": now_iso(),
    }
    await db.investigations.insert_one(inv)
    inv.pop("_id", None)
    await log_audit(ws_id(user), user, "investigation.create", body.title, "Opened investigation")
    return inv


@api.patch("/investigations/{iid}")
async def update_investigation(iid: str, body: InvestigationUpdate, user: dict = Depends(require_role("analyst"))):
    inv = await db.investigations.find_one({"workspace_id": ws_id(user), "id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    updates = {}
    if body.status:
        updates["status"] = body.status
    if body.severity:
        updates["severity"] = body.severity
    set_ops = {"$set": updates} if updates else {}
    if body.note:
        set_ops.setdefault("$push", {})["notes"] = {
            "author": user.get("name"), "text": body.note, "at": now_iso()}
    if set_ops:
        await db.investigations.update_one({"workspace_id": ws_id(user), "id": iid}, set_ops)
    return await db.investigations.find_one({"workspace_id": ws_id(user), "id": iid}, {"_id": 0})


# ---------- Platform Integrations ----------
PROVIDER_NAMES = {"ga4": "Google Analytics 4", "google_ads": "Google Ads", "meta_ads": "Meta Ads",
                  "webhook": "Outbound Webhook", "hubspot": "HubSpot CRM"}


@api.get("/integrations")
async def list_integrations(user: dict = Depends(get_current_user)):
    items = await db.integrations.find({"workspace_id": ws_id(user)}, {"_id": 0}).to_list(50)
    return {"integrations": items}


@api.post("/integrations/{provider}/connect")
async def connect_integration(provider: str, user: dict = Depends(require_role("admin"))):
    existing = await db.integrations.find_one({"workspace_id": ws_id(user), "provider": provider}, {"_id": 0})
    metrics = {"ga4": "Syncing conversion events", "google_ads": "Campaigns linked",
               "meta_ads": "Ad sets linked", "webhook": "Endpoint active",
               "hubspot": "Syncing lead quality scores"}
    payload = {
        "status": "connected", "connected_at": now_iso(),
        "last_sync": now_iso(), "metric": metrics.get(provider, "Connected"),
        "config": {"demo": True},
    }
    if existing:
        await db.integrations.update_one(
            {"workspace_id": ws_id(user), "provider": provider}, {"$set": payload})
    else:
        await db.integrations.insert_one({
            "id": str(uuid.uuid4()), "workspace_id": ws_id(user), "provider": provider,
            "name": PROVIDER_NAMES.get(provider, provider), **payload})
    await log_audit(ws_id(user), user, "integration.connect", PROVIDER_NAMES.get(provider, provider),
                    "Connected integration (simulated)")
    return await db.integrations.find_one({"workspace_id": ws_id(user), "provider": provider}, {"_id": 0})


@api.post("/integrations/{provider}/disconnect")
async def disconnect_integration(provider: str, user: dict = Depends(require_role("admin"))):
    await db.integrations.update_one(
        {"workspace_id": ws_id(user), "provider": provider},
        {"$set": {"status": "disconnected", "connected_at": None, "last_sync": None}})
    await log_audit(ws_id(user), user, "integration.disconnect", PROVIDER_NAMES.get(provider, provider),
                    "Disconnected integration")
    return await db.integrations.find_one({"workspace_id": ws_id(user), "provider": provider}, {"_id": 0})


# ---------- Alerts ----------
@api.get("/alerts")
async def list_alerts(user: dict = Depends(get_current_user)):
    items = await db.alerts.find({"workspace_id": ws_id(user)}, {"_id": 0}) \
        .sort("created_at", -1).to_list(100)
    unread = sum(1 for a in items if not a.get("read"))
    return {"alerts": items, "unread": unread}


@api.post("/alerts/{aid}/read")
async def read_alert(aid: str, user: dict = Depends(get_current_user)):
    await db.alerts.update_one({"workspace_id": ws_id(user), "id": aid}, {"$set": {"read": True}})
    return {"ok": True}


# ---------- User Audit logs ----------
@api.get("/audit-logs")
async def audit_logs(user: dict = Depends(get_current_user)):
    items = await db.audit_logs.find({"workspace_id": ws_id(user)}, {"_id": 0}) \
        .sort("created_at", -1).limit(200).to_list(200)
    return {"logs": items}


# ---------- Workspace & members ----------
@api.get("/workspace")
async def get_workspace(user: dict = Depends(get_current_user)):
    ws = await db.workspaces.find_one({"id": ws_id(user)}, {"_id": 0})
    sites = await db.sites.find({"workspace_id": ws_id(user)}, {"_id": 0}).to_list(50)
    return {"workspace": ws, "sites": sites}


@api.patch("/workspace")
async def update_workspace(body: WorkspaceUpdate, user: dict = Depends(require_role("admin"))):
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        await db.workspaces.update_one({"id": ws_id(user)}, {"$set": updates})
        if "sensitivity_profile" in updates:
            await log_audit(ws_id(user), user, "sensitivity.update", "Workspace",
                            f"Changed sensitivity to {updates['sensitivity_profile']}")
    return await db.workspaces.find_one({"id": ws_id(user)}, {"_id": 0})


@api.get("/workspace/members")
async def list_members(user: dict = Depends(get_current_user)):
    members = await db.users.find({"workspace_id": ws_id(user)},
                                  {"_id": 0, "password_hash": 0}).to_list(100)
    return {"members": members}


@api.post("/workspace/members")
async def invite_member(body: InviteMemberRequest, user: dict = Depends(require_role("admin"))):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="A user with this email already exists")
    new_user = {
        "id": str(uuid.uuid4()), "name": body.name, "email": email,
        "password_hash": hash_password(body.password), "role": body.role,
        "workspace_id": ws_id(user), "created_at": now_iso(),
    }
    await db.users.insert_one(new_user)
    await log_audit(ws_id(user), user, "member.invite", body.email, f"Invited as {body.role}")
    return public_user(new_user)


@api.delete("/workspace/members/{mid}")
async def remove_member(mid: str, user: dict = Depends(require_role("admin"))):
    if mid == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    m = await db.users.find_one({"workspace_id": ws_id(user), "id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.users.delete_one({"workspace_id": ws_id(user), "id": mid})
    await log_audit(ws_id(user), user, "member.remove", m.get("email"), "Removed member")
    return {"ok": True}


# ---------- Sites / SDK keys ----------
@api.get("/sites")
async def list_sites(user: dict = Depends(get_current_user)):
    sites = await db.sites.find({"workspace_id": ws_id(user)}, {"_id": 0}).to_list(50)
    backend = os.environ.get("FRONTEND_URL", "")
    for s in sites:
        s["snippet"] = f'<script async src="{backend}/api/poh.js" data-poh-key="{s["sdk_key"]}"></script>'
    return {"sites": sites}


@api.post("/sites")
async def create_site(body: SiteCreate, user: dict = Depends(require_role("admin"))):
    site = {
        "id": str(uuid.uuid4()), "workspace_id": ws_id(user), "name": body.name,
        "domain": body.domain, "sdk_key": "poh_" + secrets.token_hex(16),
        "created_at": now_iso(),
    }
    await db.sites.insert_one(site)
    site.pop("_id", None)
    await log_audit(ws_id(user), user, "site.create", body.domain, "Added new property")
    backend = os.environ.get("FRONTEND_URL", "")
    site["snippet"] = f'<script async src="{backend}/api/poh.js" data-poh-key="{site["sdk_key"]}"></script>'
    return site


# ---------- Demo data ----------
@api.post("/demo/seed")
async def seed_demo(user: dict = Depends(require_role("admin"))):
    site = await db.sites.find_one({"workspace_id": ws_id(user)}, {"_id": 0})
    if not site:
        raise HTTPException(status_code=400, detail="No site found for workspace")
    result = await generate_demo_data(ws_id(user), site["id"])
    return {"ok": True, **result}


# ---------- Meta ----------
@api.get("/meta/reason-codes")
async def reason_codes():
    return {"reason_codes": [{"code": k, **v} for k, v in REASON_CODES.items()]}
