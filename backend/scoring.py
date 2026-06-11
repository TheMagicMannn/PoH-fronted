"""Layered evidence scoring + rules engine for PoH.

Deterministic, explainable scoring shared by live ingestion and the demo seeder.
Never a black box: every fraud point maps to a human-readable reason code.
"""
from typing import Optional

# Reason code catalog: code -> { label, category, weight_hint }
REASON_CODES = {
    "browser_automation_detected": {
        "label": "Browser automation indicators (WebDriver) present",
        "category": "automation",
    },
    "headless_browser_indicators": {
        "label": "Headless browser signature detected",
        "category": "automation",
    },
    "missing_browser_plugins": {
        "label": "No browser plugins on a desktop client",
        "category": "fingerprint",
    },
    "no_language_preferences": {
        "label": "Browser reports no language preferences",
        "category": "fingerprint",
    },
    "low_human_interaction_depth": {
        "label": "Low human interaction depth (no mouse/scroll/keys)",
        "category": "behavioral",
    },
    "instant_bounce_timing": {
        "label": "Session ended near-instantly (sub-second)",
        "category": "behavioral",
    },
    "tor_exit_node": {
        "label": "Connection originates from a Tor exit node",
        "category": "network",
    },
    "proxy_detected": {
        "label": "Anonymizing proxy detected",
        "category": "network",
    },
    "vpn_usage": {
        "label": "Commercial VPN in use",
        "category": "network",
    },
    "datacenter_ip_origin": {
        "label": "Traffic originates from a hosting / datacenter IP",
        "category": "network",
    },
    "repeated_fingerprint_short_window": {
        "label": "Same device fingerprint repeated in a short window",
        "category": "recurrence",
    },
    "recurring_fingerprint_pattern": {
        "label": "Recurring device fingerprint across sessions",
        "category": "recurrence",
    },
    "abnormal_click_to_conversion_timing": {
        "label": "Abnormally fast click-to-conversion timing",
        "category": "behavioral",
    },
    "anomalous_hardware_profile": {
        "label": "Anomalous hardware concurrency profile",
        "category": "fingerprint",
    },
    "high_velocity_source": {
        "label": "High request velocity from traffic source",
        "category": "velocity",
    },
}


def score_session(signals: dict, recurrence: int = 0) -> dict:
    """Compute a layered evidence score for a session.

    Returns trust_score, fraud_score, confidence, classification, reason_codes.
    """
    sig = signals or {}
    fraud = 0
    reasons = []

    def add(points, code):
        nonlocal fraud
        fraud += points
        if code not in reasons:
            reasons.append(code)

    ua = (sig.get("user_agent") or "").lower()
    is_mobile = bool(sig.get("is_mobile"))

    if sig.get("webdriver"):
        add(35, "browser_automation_detected")

    headless = bool(sig.get("headless")) or any(
        t in ua for t in ("headlesschrome", "phantom", "puppeteer", "playwright", "electron")
    )
    if headless:
        add(30, "headless_browser_indicators")

    plugins = sig.get("plugins_count")
    if plugins is not None and plugins == 0 and not is_mobile:
        add(10, "missing_browser_plugins")

    langs = sig.get("languages_count")
    if langs is not None and langs == 0:
        add(8, "no_language_preferences")

    interaction = sig.get("interaction_depth")
    top = sig.get("time_on_page")
    if interaction is not None and interaction < 3 and (top is None or top < 4):
        add(20, "low_human_interaction_depth")

    if top is not None and top < 1:
        add(8, "instant_bounce_timing")

    if sig.get("tor"):
        add(25, "tor_exit_node")
    if sig.get("proxy"):
        add(15, "proxy_detected")
    if sig.get("vpn"):
        add(12, "vpn_usage")
    if sig.get("datacenter_ip"):
        add(20, "datacenter_ip_origin")

    if recurrence and recurrence > 5:
        add(25, "repeated_fingerprint_short_window")
    elif recurrence and recurrence > 2:
        add(12, "recurring_fingerprint_pattern")

    ctc = sig.get("click_to_conversion_ms")
    if ctc is not None and ctc < 1500:
        add(22, "abnormal_click_to_conversion_timing")

    hc = sig.get("hardware_concurrency")
    if hc is not None and hc >= 32:
        add(8, "anomalous_hardware_profile")

    if sig.get("source_velocity") and sig.get("source_velocity") > 200:
        add(8, "high_velocity_source")

    fraud = max(0, min(100, fraud))
    trust = 100 - fraud

    strong = len(reasons)
    completeness = sum(
        1
        for k in ("webdriver", "plugins_count", "languages_count", "interaction_depth", "time_on_page")
        if sig.get(k) is not None
    )
    if strong == 0:
        confidence = min(96, 70 + completeness * 4)
    else:
        confidence = min(99, 55 + strong * 7 + completeness * 3)

    classification = (
        "fraudulent" if fraud >= 70 else "suspicious" if fraud >= 40 else "trusted"
    )

    return {
        "fraud_score": fraud,
        "trust_score": trust,
        "confidence": confidence,
        "classification": classification,
        "reason_codes": reasons,
    }


# Sensitivity profile -> action thresholds on fraud_score
SENSITIVITY_THRESHOLDS = {
    "aggressive": {"block": 60, "review": 35, "flag": 20},
    "balanced": {"block": 75, "review": 50, "flag": 30},
    "conservative": {"block": 85, "review": 65, "flag": 45},
}


def default_action(fraud_score: int, confidence: int, sensitivity: str = "balanced") -> str:
    t = SENSITIVITY_THRESHOLDS.get(sensitivity, SENSITIVITY_THRESHOLDS["balanced"])
    # Low-confidence high-risk events are routed to review rather than auto-blocked.
    if fraud_score >= t["block"]:
        return "block" if confidence >= 65 else "review"
    if fraud_score >= t["review"]:
        return "review"
    if fraud_score >= t["flag"]:
        return "flag"
    return "observe"


def _op_match(op: str, left, right) -> bool:
    try:
        if op == "gt":
            return float(left) > float(right)
        if op == "gte":
            return float(left) >= float(right)
        if op == "lt":
            return float(left) < float(right)
        if op == "lte":
            return float(left) <= float(right)
        if op == "eq":
            return str(left).lower() == str(right).lower()
        if op == "neq":
            return str(left).lower() != str(right).lower()
        if op == "contains":
            return str(right).lower() in str(left).lower()
    except (ValueError, TypeError):
        return False
    return False


def evaluate_rules(record: dict, rules: list) -> Optional[dict]:
    """Evaluate custom workspace rules against a scored record.

    Returns the matched rule dict (highest priority) or None.
    Rule shape: { conditions: [{field, op, value}], action, priority, ... }
    A rule matches when ALL its conditions are true.
    """
    matched = []
    for rule in rules:
        if not rule.get("enabled", True):
            continue
        conditions = rule.get("conditions", [])
        if not conditions:
            continue
        ok = True
        for cond in conditions:
            field = cond.get("field")
            value = record.get(field)
            if field in record.get("signals", {}) and value is None:
                value = record["signals"].get(field)
            if not _op_match(cond.get("op"), value, cond.get("value")):
                ok = False
                break
        if ok:
            matched.append(rule)
    if not matched:
        return None
    matched.sort(key=lambda r: r.get("priority", 0), reverse=True)
    return matched[0]


def decide(record: dict, rules: list, sensitivity: str) -> dict:
    """Return final action + the rule that triggered it (if any)."""
    rule = evaluate_rules(record, rules)
    if rule:
        return {"action": rule.get("action", "flag"), "rule_id": rule.get("id"), "rule_name": rule.get("name")}
    action = default_action(record.get("fraud_score", 0), record.get("confidence", 0), sensitivity)
    return {"action": action, "rule_id": None, "rule_name": None}
