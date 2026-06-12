"""Comprehensive backend API tests for PoH — Trust & Fraud Intelligence."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trust-platform-21.preview.emergentagent.com").rstrip("/")
DEMO_EMAIL = "analyst@poh.io"
DEMO_PASSWORD = "PohDemo2026!"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def demo_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, f"Demo login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def fresh_session():
    """A freshly-registered user (empty workspace)."""
    s = requests.Session()
    email = f"tester_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": "Testpass!2026", "name": "Test User",
        "company": "TEST Workspace"
    })
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    return s, email


# ---------- Health ----------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_login_success_sets_cookie(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login",
                   json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == DEMO_EMAIL
        assert data["role"] in ("owner", "admin", "analyst")
        assert "workspace_id" in data
        # cookie present
        assert any(c.name == "access_token" for c in s.cookies)

    def test_me(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_login_invalid_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": DEMO_EMAIL, "password": "wrong-password"})
        assert r.status_code == 401

    def test_register_and_logout(self):
        s = requests.Session()
        email = f"signup_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Testpass!2026", "name": "Signup User"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == email
        assert data["role"] == "owner"
        # logout
        r = s.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200
        # me should fail now
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------- Overview / KPIs ----------
class TestOverview:
    def test_overview_demo_has_data(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/overview", params={"range": "7d"})
        assert r.status_code == 200
        data = r.json()
        kpis = data["kpis"]
        assert kpis["total_sessions"] > 0
        assert kpis["fraudulent"] >= 0
        # Scoring sanity — suspicious must be non-zero
        assert kpis["suspicious"] > 0, f"Expected suspicious>0, got {kpis}"
        # Distribution + trend present
        assert len(data["distribution"]) == 3
        assert "by_source" in data
        assert "top_reasons" in data

    def test_overview_ranges(self, demo_session):
        for rng in ("24h", "7d", "14d", "30d"):
            r = demo_session.get(f"{BASE_URL}/api/overview", params={"range": rng})
            assert r.status_code == 200
            assert r.json()["range"] == rng

    def test_overview_fresh_user_empty(self, fresh_session):
        s, _ = fresh_session
        r = s.get(f"{BASE_URL}/api/overview")
        assert r.status_code == 200
        assert r.json()["kpis"]["total_sessions"] == 0


# ---------- Sessions ----------
class TestSessions:
    def test_list(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/sessions", params={"page_size": 5})
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data
        assert data["total"] > 0

    def test_filter_classification(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/sessions",
                             params={"classification": "fraudulent", "page_size": 5})
        assert r.status_code == 200
        items = r.json()["items"]
        for it in items:
            assert it["classification"] == "fraudulent"
        # Fraudulent sessions must carry signature reason codes
        if items:
            all_codes = set()
            for it in items:
                all_codes.update(it.get("reason_codes", []))
            assert any(c in all_codes for c in
                       ("browser_automation_detected", "headless_browser_indicators",
                        "datacenter_ip_origin", "fingerprint_recurrence_spike")), \
                f"No expected fraud reason codes in {all_codes}"

    def test_session_action(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/sessions", params={"page_size": 1})
        sid = r.json()["items"][0]["id"]
        r = demo_session.post(f"{BASE_URL}/api/sessions/{sid}/action",
                              json={"action": "review", "note": "TEST"})
        assert r.status_code == 200
        assert r.json()["action"] == "review"
        # verify
        r = demo_session.get(f"{BASE_URL}/api/sessions/{sid}")
        assert r.status_code == 200
        assert r.json()["action"] == "review"


# ---------- Conversions ----------
class TestConversions:
    def test_list(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/conversions", params={"page_size": 5})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] > 0

    def test_conversion_action(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/conversions", params={"page_size": 1})
        cid = r.json()["items"][0]["id"]
        r = demo_session.post(f"{BASE_URL}/api/conversions/{cid}/action",
                              json={"status": "suppressed", "note": "TEST"})
        assert r.status_code == 200
        assert r.json()["status"] == "suppressed"


# ---------- Campaigns ----------
class TestCampaigns:
    def test_campaigns(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/campaigns", params={"range": "30d"})
        assert r.status_code == 200
        assert len(r.json()["campaigns"]) > 0


# ---------- Rules ----------
class TestRules:
    def test_create_toggle_delete(self, demo_session):
        # Create
        r = demo_session.post(f"{BASE_URL}/api/rules", json={
            "name": "TEST_rule_" + uuid.uuid4().hex[:6],
            "description": "test", "enabled": True,
            "conditions": [{"field": "fraud_score", "op": ">=", "value": 80}],
            "action": "block", "priority": 5,
        })
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        # List contains new rule
        r = demo_session.get(f"{BASE_URL}/api/rules")
        assert any(x["id"] == rid for x in r.json()["rules"])
        # Toggle off
        r = demo_session.patch(f"{BASE_URL}/api/rules/{rid}", json={"enabled": False})
        assert r.status_code == 200
        assert r.json()["enabled"] is False
        # Delete
        r = demo_session.delete(f"{BASE_URL}/api/rules/{rid}")
        assert r.status_code == 200


# ---------- Investigations ----------
class TestInvestigations:
    def test_clusters_and_investigation_flow(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/clusters")
        assert r.status_code == 200
        clusters = r.json()["clusters"]
        assert len(clusters) > 0
        # Create investigation from first cluster
        r = demo_session.post(f"{BASE_URL}/api/investigations", json={
            "title": "TEST_inv_" + uuid.uuid4().hex[:6],
            "severity": "high",
            "cluster_id": clusters[0]["id"],
            "notes": "Auto opened from cluster",
        })
        assert r.status_code == 200, r.text
        iid = r.json()["id"]
        # Update status
        r = demo_session.patch(f"{BASE_URL}/api/investigations/{iid}",
                               json={"status": "in_progress"})
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"


# ---------- Integrations ----------
class TestIntegrations:
    def test_connect_disconnect(self, demo_session):
        r = demo_session.post(f"{BASE_URL}/api/integrations/ga4/connect")
        assert r.status_code == 200
        assert r.json()["status"] == "connected"
        r = demo_session.post(f"{BASE_URL}/api/integrations/ga4/disconnect")
        assert r.status_code == 200
        assert r.json()["status"] == "disconnected"


# ---------- Workspace ----------
class TestWorkspace:
    def test_sensitivity_persist(self, demo_session):
        for profile in ("conservative", "aggressive", "balanced"):
            r = demo_session.patch(f"{BASE_URL}/api/workspace",
                                   json={"sensitivity_profile": profile})
            assert r.status_code == 200
            assert r.json()["sensitivity_profile"] == profile
        r = demo_session.get(f"{BASE_URL}/api/workspace")
        assert r.json()["workspace"]["sensitivity_profile"] == "balanced"

    def test_members_invite(self, demo_session):
        email = f"TEST_invite_{uuid.uuid4().hex[:6]}@example.com"
        r = demo_session.post(f"{BASE_URL}/api/workspace/members", json={
            "email": email, "name": "Invited Tester",
            "password": "Inv!ted2026", "role": "viewer"
        })
        assert r.status_code == 200, r.text
        mid = r.json()["id"]
        r = demo_session.get(f"{BASE_URL}/api/workspace/members")
        assert any(m["id"] == mid for m in r.json()["members"])

    def test_audit_logs(self, demo_session):
        r = demo_session.get(f"{BASE_URL}/api/audit-logs")
        assert r.status_code == 200


# ---------- SDK ingestion ----------
class TestSDK:
    def test_poh_js_served(self):
        r = requests.get(f"{BASE_URL}/api/poh.js")
        assert r.status_code == 200
        assert "javascript" in r.headers.get("content-type", "")
        assert len(r.text) > 100

    def test_collect_invalid_key(self):
        r = requests.post(f"{BASE_URL}/api/collect", json={
            "sdk_key": "bad_key", "page": "/", "signals": {}
        })
        assert r.status_code == 404

    def test_collect_valid_key(self):
        # Use seeded demo SDK key
        r = requests.post(f"{BASE_URL}/api/collect", json={
            "sdk_key": "poh_demo_northwind_live_key",
            "page": "/landing",
            "signals": {
                "user_agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0",
                "timezone": "America/New_York",
                "screen_w": 1920, "screen_h": 1080,
                "languages": ["en-US"], "webdriver": False,
            },
            "utm": {"source": "google", "medium": "cpc", "campaign": "demo"},
            "fingerprint": "fp_test_" + uuid.uuid4().hex[:8],
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "score" in data and "action" in data
        assert data["score"]["classification"] in ("trusted", "suspicious", "fraudulent")

    def test_convert_valid_key(self):
        r = requests.post(f"{BASE_URL}/api/convert", json={
            "sdk_key": "poh_demo_northwind_live_key",
            "type": "purchase", "value": 49.0, "currency": "USD",
            "signals": {"user_agent": "Mozilla/5.0"},
            "utm": {"source": "google", "medium": "cpc"},
            "fingerprint": "fp_test_conv",
        })
        assert r.status_code == 200
        assert r.json()["status"] in ("accepted", "review", "blocked")


# ---------- Fresh user onboarding ----------
class TestOnboarding:
    def test_fresh_user_has_sdk_key(self, fresh_session):
        s, _ = fresh_session
        r = s.get(f"{BASE_URL}/api/sites")
        assert r.status_code == 200
        sites = r.json()["sites"]
        assert len(sites) == 1
        assert sites[0]["sdk_key"].startswith("poh_")
        assert "snippet" in sites[0]

    def test_fresh_user_can_seed_demo(self, fresh_session):
        s, _ = fresh_session
        r = s.post(f"{BASE_URL}/api/demo/seed")
        assert r.status_code == 200
        r = s.get(f"{BASE_URL}/api/overview")
        assert r.json()["kpis"]["total_sessions"] > 0
