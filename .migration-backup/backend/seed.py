"""Demo data generator — makes a workspace's dashboard feel alive.

All scores are produced by the real scoring engine so seeded data is consistent
with live SDK ingestion. Idempotent per workspace (clears then regenerates).
"""
import uuid
import random
from datetime import datetime, timezone, timedelta

from db import db
from scoring import score_session, default_action

COUNTRIES = [
    ("United States", "New York", "America/New_York"),
    ("United States", "San Francisco", "America/Los_Angeles"),
    ("United States", "Austin", "America/Chicago"),
    ("United Kingdom", "London", "Europe/London"),
    ("Germany", "Berlin", "Europe/Berlin"),
    ("India", "Bengaluru", "Asia/Kolkata"),
    ("Singapore", "Singapore", "Asia/Singapore"),
    ("Canada", "Toronto", "America/New_York"),
]

SOURCES = [
    # (source, medium, campaign, ad_set, fraud_bias)
    ("google", "cpc", "Brand - Search", "Exact Match", 0.06),
    ("google", "cpc", "Competitor - Search", "Phrase Match", 0.22),
    ("google", "cpc", "Generic - Non-Brand", "Broad Match", 0.18),
    ("meta", "paid_social", "Prospecting - Lookalike 1%", "Creative A", 0.27),
    ("meta", "paid_social", "Retargeting - 30d", "Carousel", 0.31),
    ("bing", "cpc", "Search - Generic", "Phrase Match", 0.16),
    ("google", "organic", "(organic)", "", 0.04),
    ("direct", "none", "(direct)", "", 0.05),
    ("newsletter", "email", "Weekly Digest", "", 0.07),
]

DEVICES = [("Desktop", "Windows", "Chrome"), ("Desktop", "macOS", "Safari"),
           ("Mobile", "iOS", "Safari"), ("Mobile", "Android", "Chrome"),
           ("Desktop", "Windows", "Edge"), ("Tablet", "iOS", "Safari")]

LANDING = ["/lp/free-trial", "/pricing", "/demo", "/lp/ebook-download", "/products/pro",
           "/checkout", "/signup", "/"]

UA_HUMAN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
UA_BOT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0 Safari/537.36"


def now_utc():
    return datetime.now(timezone.utc)


def rand_dt(days_back=14):
    # weight recent days slightly more
    d = random.triangular(0, days_back, days_back * 0.35)
    dt = now_utc() - timedelta(days=d, hours=random.uniform(0, 24), minutes=random.uniform(0, 60))
    return dt


def _signals_for(label, bot_fingerprint=None):
    if label == "trusted":
        return {
            "user_agent": UA_HUMAN, "webdriver": False, "headless": False,
            "plugins_count": random.randint(3, 6), "languages_count": random.randint(1, 2),
            "hardware_concurrency": random.choice([4, 8, 12]), "device_memory": 8,
            "interaction_depth": random.randint(18, 140), "time_on_page": random.randint(25, 320),
            "scroll_depth": random.randint(40, 100), "proxy": False, "vpn": False,
            "datacenter_ip": False, "is_mobile": False,
        }, 0
    if label == "suspicious":
        # Stack 2-3 moderate signals so the fraud score lands in the 40-68 band.
        s = {
            "user_agent": UA_HUMAN, "webdriver": False, "headless": False,
            "plugins_count": random.randint(2, 4), "languages_count": 1,
            "hardware_concurrency": random.choice([4, 8]), "device_memory": 8,
            "interaction_depth": random.randint(6, 25), "time_on_page": random.randint(8, 40),
            "scroll_depth": random.randint(10, 60), "proxy": False, "vpn": False,
            "datacenter_ip": False, "is_mobile": False,
        }
        combo = random.choice([
            ("datacenter", "lowint"),
            ("proxy", "lowint", "missing_plugins"),
            ("vpn", "datacenter", "missing_plugins"),
            ("proxy", "datacenter", "no_lang"),
            ("proxy", "vpn", "lowint"),
            ("datacenter", "missing_plugins", "no_lang"),
        ])
        for f in combo:
            if f == "proxy":
                s["proxy"] = True
            elif f == "vpn":
                s["vpn"] = True
            elif f == "datacenter":
                s["datacenter_ip"] = True
            elif f == "missing_plugins":
                s["plugins_count"] = 0
            elif f == "no_lang":
                s["languages_count"] = 0
            elif f == "lowint":
                s["interaction_depth"] = random.randint(0, 2)
                s["time_on_page"] = random.randint(2, 4)
        return s, random.choice([0, 0, 3])
    # fraudulent
    s = {
        "user_agent": UA_BOT, "webdriver": True, "headless": True,
        "plugins_count": 0, "languages_count": 0, "hardware_concurrency": random.choice([1, 2, 64]),
        "device_memory": None, "interaction_depth": random.randint(0, 2), "time_on_page": random.randint(0, 2),
        "scroll_depth": 0, "proxy": random.random() < 0.6, "vpn": random.random() < 0.3,
        "datacenter_ip": True, "is_mobile": False,
    }
    return s, random.randint(6, 12)


async def generate_demo_data(workspace_id: str, site_id: str, n_sessions: int = 460):
    cols = ["sessions", "conversions", "fraud_clusters", "investigations", "alerts",
            "audit_logs", "rules", "integrations"]
    for c in cols:
        await db[c].delete_many({"workspace_id": workspace_id})

    sessions = []
    # Shared fingerprints for fraud clusters
    cluster_fps = ["fp_a17ffd", "fp_b9023c", "fp_4d77e1", "fp_0ccae9"]

    for _ in range(n_sessions):
        src, med, camp, adset, bias = random.choice(SOURCES)
        roll = random.random()
        if roll < bias:
            label = "fraudulent"
        elif roll < bias + 0.20:
            label = "suspicious"
        else:
            label = "trusted"

        sig, recurrence = _signals_for(label)
        country, city, tz = random.choice(COUNTRIES)
        device, os_name, browser = random.choice(DEVICES)
        if device == "Mobile":
            sig["is_mobile"] = True
            sig["user_agent"] = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1 Mobile Safari"
        sig["timezone"] = tz

        score = score_session(sig, recurrence)
        action = default_action(score["fraud_score"], score["confidence"], "balanced")

        if label == "fraudulent" and random.random() < 0.7:
            fp = random.choice(cluster_fps)
        else:
            fp = "fp_" + uuid.uuid4().hex[:8]

        started = rand_dt()
        cost = round(random.uniform(0.6, 3.2), 2) if med in ("cpc", "paid_social") else 0.0
        sessions.append({
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "site_id": site_id,
            "session_id": "s_" + uuid.uuid4().hex[:12],
            "ip": f"{random.randint(11,220)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
            "country": country, "city": city,
            "device_type": device, "os": os_name, "browser": browser,
            "user_agent": sig["user_agent"],
            "source": src, "medium": med, "campaign": camp, "ad_set": adset,
            "keyword": random.choice(["pricing", "buy now", "free trial", "best crm", ""]) if med == "cpc" else "",
            "landing_page": random.choice(LANDING), "referrer": "",
            "fingerprint_hash": fp, "signals": sig, "recurrence": recurrence,
            "trust_score": score["trust_score"], "fraud_score": score["fraud_score"],
            "confidence": score["confidence"], "classification": score["classification"],
            "reason_codes": score["reason_codes"], "action": action, "triggered_rule": None,
            "cost": cost, "is_live": False, "events_count": random.randint(1, 9),
            "started_at": started.isoformat(), "updated_at": started.isoformat(),
        })

    if sessions:
        await db.sessions.insert_many(sessions)

    # Conversions tied to sessions
    conversions = []
    conv_sources = [s for s in sessions if s["medium"] in ("cpc", "paid_social", "email")]
    for _ in range(80):
        base = random.choice(conv_sources or sessions)
        ctype = random.choice(["lead", "signup", "purchase", "lead", "signup"])
        is_bad = base["classification"] != "trusted" and random.random() < 0.7
        sig = dict(base["signals"])
        if is_bad:
            sig["click_to_conversion_ms"] = random.randint(200, 1400)
        else:
            sig["click_to_conversion_ms"] = random.randint(4000, 90000)
        score = score_session(sig, base["recurrence"])
        action = default_action(score["fraud_score"], score["confidence"], "balanced")
        status = "blocked" if action == "block" else "review" if action == "review" else "accepted"
        value = {"lead": 0, "signup": 0, "purchase": round(random.uniform(29, 480), 2)}[ctype]
        created = datetime.fromisoformat(base["started_at"]) + timedelta(minutes=random.randint(1, 50))
        conversions.append({
            "id": str(uuid.uuid4()), "workspace_id": workspace_id, "site_id": site_id,
            "session_id": base["session_id"], "type": ctype, "value": value, "currency": "USD",
            "source": base["source"], "campaign": base["campaign"],
            "fingerprint_hash": base["fingerprint_hash"],
            "trust_score": score["trust_score"], "fraud_score": score["fraud_score"],
            "confidence": score["confidence"], "classification": score["classification"],
            "reason_codes": score["reason_codes"], "status": status, "action": action,
            "is_live": False, "created_at": created.isoformat(),
        })
    if conversions:
        await db.conversions.insert_many(conversions)

    # Fraud clusters from shared fingerprints
    clusters = []
    for i, fp in enumerate(cluster_fps):
        members = [s for s in sessions if s["fingerprint_hash"] == fp]
        if not members:
            continue
        reasons = sorted({rc for m in members for rc in m["reason_codes"]})
        clusters.append({
            "id": str(uuid.uuid4()), "workspace_id": workspace_id,
            "name": ["Datacenter Bot Ring", "Click Farm Cluster", "Headless Automation Group",
                     "Proxy Rotation Network"][i],
            "fingerprint_hash": fp, "session_count": len(members),
            "conversion_count": sum(1 for c in conversions if c["fingerprint_hash"] == fp),
            "risk": "critical" if len(members) > 6 else "high",
            "pattern": "Repeated device fingerprint across short-window conversions",
            "reason_codes": reasons[:5],
            "top_sources": list({m["source"] for m in members})[:3],
            "first_seen": min(m["started_at"] for m in members),
            "last_seen": max(m["started_at"] for m in members),
        })
    if clusters:
        await db.fraud_clusters.insert_many(clusters)

    # Investigations
    investigations = []
    inv_templates = [
        ("Spike in fraudulent leads from Meta Retargeting", "high", "open"),
        ("Datacenter bot ring hitting /checkout", "critical", "in_review"),
        ("VPN cluster on Competitor - Search campaign", "medium", "resolved"),
    ]
    for title, sev, status in inv_templates:
        cl = random.choice(clusters) if clusters else None
        investigations.append({
            "id": str(uuid.uuid4()), "workspace_id": workspace_id, "title": title,
            "severity": sev, "status": status,
            "assignee": random.choice(["Avery Chen", "Unassigned", "Jordan Patel"]),
            "cluster_id": cl["id"] if cl else None,
            "notes": [{"author": "Avery Chen", "text": "Opened from anomaly alert.",
                       "at": (now_utc() - timedelta(days=random.randint(1, 5))).isoformat()}],
            "created_at": (now_utc() - timedelta(days=random.randint(1, 8))).isoformat(),
        })
    if investigations:
        await db.investigations.insert_many(investigations)

    # Rules
    rules = [
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "name": "Block headless automation",
         "description": "Auto-block sessions flagged with browser automation.",
         "enabled": True, "priority": 90,
         "conditions": [{"field": "fraud_score", "op": "gte", "value": 70}],
         "action": "block", "hits": random.randint(40, 120),
         "created_by": "Avery Chen", "created_at": now_utc().isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "name": "Review datacenter traffic",
         "description": "Route hosting/datacenter IP sessions to manual review.",
         "enabled": True, "priority": 60,
         "conditions": [{"field": "fraud_score", "op": "gte", "value": 45},
                        {"field": "fraud_score", "op": "lt", "value": 70}],
         "action": "review", "hits": random.randint(20, 80),
         "created_by": "Avery Chen", "created_at": now_utc().isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "name": "Flag VPN on paid search",
         "description": "Flag suspicious VPN sessions arriving on CPC campaigns.",
         "enabled": True, "priority": 40,
         "conditions": [{"field": "classification", "op": "eq", "value": "suspicious"}],
         "action": "flag", "hits": random.randint(15, 60),
         "created_by": "Jordan Patel", "created_at": now_utc().isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "name": "Observe organic traffic",
         "description": "Keep organic/direct traffic in observe-only mode.",
         "enabled": False, "priority": 10,
         "conditions": [{"field": "source", "op": "eq", "value": "google"}],
         "action": "observe", "hits": 0,
         "created_by": "Avery Chen", "created_at": now_utc().isoformat()},
    ]
    await db.rules.insert_many(rules)

    # Integrations
    integrations = [
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "provider": "ga4",
         "name": "Google Analytics 4", "status": "connected",
         "config": {"property_id": "G-7H2K9QX"}, "metric": "Syncing 12 conversion events",
         "connected_at": (now_utc() - timedelta(days=12)).isoformat(),
         "last_sync": (now_utc() - timedelta(minutes=14)).isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "provider": "google_ads",
         "name": "Google Ads", "status": "connected",
         "config": {"customer_id": "284-991-0042"}, "metric": "8 campaigns linked",
         "connected_at": (now_utc() - timedelta(days=12)).isoformat(),
         "last_sync": (now_utc() - timedelta(minutes=33)).isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "provider": "meta_ads",
         "name": "Meta Ads", "status": "connected",
         "config": {"ad_account": "act_55120098"}, "metric": "5 ad sets linked",
         "connected_at": (now_utc() - timedelta(days=9)).isoformat(),
         "last_sync": (now_utc() - timedelta(hours=1)).isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "provider": "webhook",
         "name": "Outbound Webhook", "status": "disconnected", "config": {},
         "metric": "Push fraud verdicts to your stack", "connected_at": None, "last_sync": None},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "provider": "hubspot",
         "name": "HubSpot CRM", "status": "disconnected", "config": {},
         "metric": "Sync lead quality scores", "connected_at": None, "last_sync": None},
    ]
    await db.integrations.insert_many(integrations)

    # Alerts
    alerts = [
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "type": "anomaly", "severity": "critical",
         "message": "Fraudulent conversion rate on Meta Retargeting jumped to 38% (+21% vs 7d avg).",
         "read": False, "created_at": (now_utc() - timedelta(hours=2)).isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "type": "rule", "severity": "high",
         "message": "Rule 'Block headless automation' blocked 18 sessions in the last hour.",
         "read": False, "created_at": (now_utc() - timedelta(hours=5)).isoformat()},
        {"id": str(uuid.uuid4()), "workspace_id": workspace_id, "type": "cluster", "severity": "high",
         "message": "New fraud cluster 'Datacenter Bot Ring' detected with 9 sessions.",
         "read": True, "created_at": (now_utc() - timedelta(days=1)).isoformat()},
    ]
    await db.alerts.insert_many(alerts)

    # Audit logs
    audits = [
        ("Avery Chen", "rule.create", "Block headless automation", "Created blocking rule"),
        ("Avery Chen", "sensitivity.update", "Workspace", "Changed sensitivity to balanced"),
        ("Jordan Patel", "integration.connect", "Meta Ads", "Connected Meta Ads account"),
        ("Avery Chen", "conversion.suppress", "Conversion #a91f", "Suppressed fraudulent conversion"),
        ("Jordan Patel", "rule.update", "Flag VPN on paid search", "Lowered threshold"),
    ]
    audit_docs = []
    for i, (who, action, target, details) in enumerate(audits):
        audit_docs.append({
            "id": str(uuid.uuid4()), "workspace_id": workspace_id, "user_name": who,
            "action": action, "target": target, "details": details,
            "created_at": (now_utc() - timedelta(hours=i * 7 + 1)).isoformat(),
        })
    await db.audit_logs.insert_many(audit_docs)

    return {"sessions": len(sessions), "conversions": len(conversions), "clusters": len(clusters)}


async def ensure_demo_seeded(workspace_id: str):
    """Seed only if the workspace has no sessions yet."""
    count = await db.sessions.count_documents({"workspace_id": workspace_id})
    if count == 0:
        site = await db.sites.find_one({"workspace_id": workspace_id}, {"_id": 0})
        if site:
            await generate_demo_data(workspace_id, site["id"])
