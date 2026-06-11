"""IPQualityScore (IPQS) proxy/VPN/Tor/datacenter enrichment for live ingestion.

Server-side only. Reads the API key from env (IPQS_API_KEY). If no key is set,
enrichment is a graceful no-op. Results are cached per-IP in MongoDB with a TTL
index to conserve IPQS credits.
"""
import os
import ipaddress
import logging
from datetime import datetime, timezone

import httpx

from db import db

logger = logging.getLogger("poh.ipqs")

IPQS_API_KEY = os.environ.get("IPQS_API_KEY", "").strip()
IPQS_STRICTNESS = int(os.environ.get("IPQS_STRICTNESS", "1"))
IPQS_TIMEOUT = float(os.environ.get("IPQS_TIMEOUT_SECONDS", "3.0"))
IP_TTL = int(os.environ.get("IP_REPUTATION_TTL_SECONDS", "86400"))
BASE_URL = "https://ipqualityscore.com"

_client: httpx.AsyncClient | None = None


def enabled() -> bool:
    return bool(IPQS_API_KEY)


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(base_url=BASE_URL, timeout=httpx.Timeout(IPQS_TIMEOUT))
    return _client


def is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        return not (addr.is_private or addr.is_loopback or addr.is_reserved
                    or addr.is_link_local or addr.is_unspecified)
    except ValueError:
        return False


async def ensure_indexes():
    try:
        await db.ip_reputation.create_index("created_at", expireAfterSeconds=IP_TTL)
        await db.ip_reputation.create_index("ip", unique=True)
        if enabled():
            logger.info("IPQS enrichment ENABLED (strictness=%s, ttl=%ss)", IPQS_STRICTNESS, IP_TTL)
        else:
            logger.info("IPQS enrichment disabled (no IPQS_API_KEY set)")
    except Exception as e:  # noqa: BLE001
        logger.warning("ipqs index setup error: %s", e)


def _normalize(data: dict) -> dict:
    conn = data.get("connection_type")
    datacenter = bool(data.get("hosting")) or (conn in ("Data Center", "hosting"))
    return {
        "proxy": bool(data.get("proxy")),
        "vpn": bool(data.get("vpn") or data.get("active_vpn")),
        "tor": bool(data.get("tor") or data.get("active_tor")),
        "datacenter_ip": datacenter,
        "fraud_score": data.get("fraud_score"),
        "isp": data.get("ISP") or data.get("isp"),
        "organization": data.get("organization"),
        "connection_type": conn,
        "recent_abuse": bool(data.get("recent_abuse")),
        "is_crawler": bool(data.get("is_crawler")),
        "bot_status": bool(data.get("bot_status")),
        "country": data.get("country_code") or data.get("country"),
        "city": data.get("city"),
        "region": data.get("region"),
        "source": "ipqs",
    }


async def _lookup(ip: str, user_agent=None, language=None) -> dict | None:
    client = await _get_client()
    path = f"/api/json/ip/{IPQS_API_KEY}/{ip}"
    params = {"strictness": IPQS_STRICTNESS}
    if user_agent:
        params["user_agent"] = user_agent
    if language:
        params["user_language"] = language
    try:
        resp = await client.get(path, params=params)
    except httpx.RequestError as e:
        logger.warning("IPQS request error: %s", e)
        return None
    if resp.status_code != 200:
        logger.warning("IPQS HTTP %s", resp.status_code)
        return None
    data = resp.json()
    if not data.get("success", True):
        logger.warning("IPQS unsuccessful: %s", data.get("message"))
        return None
    return _normalize(data)


async def get_or_fetch(ip: str, user_agent=None, language=None) -> dict | None:
    """Return cached or freshly fetched IP intelligence, or None if disabled/private."""
    if not enabled() or not is_public_ip(ip):
        return None
    cached = await db.ip_reputation.find_one({"ip": ip}, {"_id": 0, "intel": 1})
    if cached and cached.get("intel"):
        return cached["intel"]
    intel = await _lookup(ip, user_agent, language)
    if intel is not None:
        await db.ip_reputation.update_one(
            {"ip": ip},
            {"$set": {"ip": ip, "intel": intel, "created_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
    return intel
