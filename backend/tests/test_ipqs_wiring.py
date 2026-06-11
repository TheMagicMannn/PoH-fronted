"""Unit tests for IPQS wiring in sdk_routes (client IP resolution + signal merge).

These tests mock the IPQS network call so they run without API credits and verify
the enrichment correctly folds proxy/VPN/Tor/datacenter intel into session signals.
"""
import os
import sys
import asyncio

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ipqs  # noqa: E402
import sdk_routes  # noqa: E402


class _Req:
    def __init__(self, headers=None, host="10.0.0.1"):
        self.headers = headers or {}

        class _C:
            pass

        c = _C()
        c.host = host
        self.client = c


def test_client_ip_prefers_x_forwarded_for():
    req = _Req(headers={"x-forwarded-for": "203.0.113.7, 10.0.0.1"}, host="10.0.0.1")
    assert sdk_routes.client_ip(req) == "203.0.113.7"


def test_client_ip_falls_back_to_x_real_ip():
    req = _Req(headers={"x-real-ip": "198.51.100.9"}, host="10.0.0.1")
    assert sdk_routes.client_ip(req) == "198.51.100.9"


def test_client_ip_falls_back_to_socket_host():
    req = _Req(headers={}, host="192.0.2.55")
    assert sdk_routes.client_ip(req) == "192.0.2.55"


def test_enrich_merges_network_signals(monkeypatch):
    async def fake_lookup(ip, ua=None, lang=None):
        return {"proxy": True, "vpn": False, "tor": True, "datacenter_ip": True,
                "country": "US", "city": "Ashburn", "isp": "Datacamp"}

    monkeypatch.setattr(ipqs, "get_or_fetch", fake_lookup)
    sig = {"user_agent": "x"}
    intel = asyncio.run(sdk_routes.enrich_with_ip_intel("203.0.113.7", sig))
    assert intel and intel["isp"] == "Datacamp"
    assert sig["proxy"] is True
    assert sig["tor"] is True
    assert sig["datacenter_ip"] is True
    assert "vpn" not in sig  # falsey intel must not stamp a signal


def test_enrich_noop_when_disabled(monkeypatch):
    async def none_lookup(ip, ua=None, lang=None):
        return None

    monkeypatch.setattr(ipqs, "get_or_fetch", none_lookup)
    sig = {"user_agent": "x"}
    intel = asyncio.run(sdk_routes.enrich_with_ip_intel("203.0.113.7", sig))
    assert intel is None
    assert sig == {"user_agent": "x"}


def test_is_public_ip_filters_private():
    assert ipqs.is_public_ip("8.8.8.8") is True
    assert ipqs.is_public_ip("10.0.0.1") is False
    assert ipqs.is_public_ip("127.0.0.1") is False
    assert ipqs.is_public_ip("not-an-ip") is False
