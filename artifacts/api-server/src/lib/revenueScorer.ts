/**
 * Revenue Protection Intelligence Engine
 *
 * Scores the financial safety of a session using signals already collected
 * by the browser SDK — no separate transaction data required at page-load time.
 *
 * Formula:
 *   revenueProtectionScore (0–100, higher = safer) =
 *     0.25 * sessionIntegrity
 *   + 0.20 * networkTrust
 *   + 0.20 * trafficQuality
 *   + 0.20 * behavioralFinancial
 *   + 0.15 * identitySignals
 */

import type { HumanScoreResult } from "./humanScorer.js";
import type { TrafficScoreResult } from "./trafficScorer.js";

export type RevenueRiskTier = "safe" | "low" | "moderate" | "elevated" | "high";
export type RevenueDecision =
  | "approve"
  | "approve_and_monitor"
  | "delay_fulfillment"
  | "step_up_verification"
  | "block_transaction";

export interface RevenueScoreResult {
  revenueProtectionScore: number;
  chargebackRiskScore: number;
  refundAbuseScore: number;
  promoAbuseScore: number;
  billingAnomalyScore: number;
  revenueDecision: RevenueDecision;
  revenueRiskTier: RevenueRiskTier;
  sessionIntegrityScore: number;
  networkTrustScore: number;
  trafficQualityScore: number;
  behavioralFinancialScore: number;
  identitySignalsScore: number;
  reasonCodes: string[];
}

interface GeoResult {
  country?: string | null;
  city?: string | null;
  ll?: [number, number];
}

function clamp(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

// ── 1. Session Integrity (25%) ─────────────────────────────────────────────
// How trustworthy is the session itself as a financial actor?

function scoreSessionIntegrity(
  humanResult: HumanScoreResult,
  signals: Record<string, unknown>,
  behavior: Record<string, unknown>,
): { score: number; codes: string[]; chargebackHints: number; refundHints: number; promoHints: number } {
  let score = 70;
  const codes: string[] = [];
  let chargebackHints = 0;
  let refundHints = 0;
  let promoHints = 0;

  const cls = humanResult.humanClassification;
  if (cls === "bot") {
    score -= 55; codes.push("bot_conversion_attempt");
    chargebackHints += 40; refundHints += 30; promoHints += 35;
  } else if (cls === "automation") {
    score -= 35; codes.push("automated_session");
    chargebackHints += 25; refundHints += 20; promoHints += 25;
  } else if (cls === "suspicious_human") {
    score -= 15; codes.push("suspicious_session_quality");
    chargebackHints += 10; refundHints += 10; promoHints += 10;
  } else if (cls === "human") {
    score += 15;
  }

  const humanScore = humanResult.humanScore;
  if (humanScore >= 85) score += 10;
  else if (humanScore >= 70) score += 5;
  else if (humanScore < 45) { score -= 10; chargebackHints += 10; }

  const webdriver = Boolean(signals["webdriver"]);
  if (webdriver) {
    score -= 20; codes.push("browser_automation_detected");
    chargebackHints += 20; promoHints += 20;
  }

  const firstMs = Number(behavior["first_interaction_ms"] ?? 0);
  const sessionMs = Number(behavior["session_duration_ms"] ?? 0);
  if (firstMs > 0 && firstMs < 200 && sessionMs > 0 && sessionMs < 500) {
    score -= 20; codes.push("inhuman_interaction_speed");
    chargebackHints += 15; promoHints += 20;
  } else if (firstMs > 500 && firstMs < 20000) {
    score += 8;
  }

  const pasteCount = Number(behavior["paste_count"] ?? 0);
  const keyEvents = Number(behavior["key_event_count"] ?? 0);
  if (pasteCount > 2 && keyEvents === 0) {
    score -= 15; codes.push("paste_only_data_entry");
    refundHints += 10; promoHints += 15;
  }

  return { score: clamp(score), codes, chargebackHints, refundHints, promoHints };
}

// ── 2. Network Trust (20%) ─────────────────────────────────────────────────
// Datacenter IPs and proxies drive the majority of CNP fraud.

function scoreNetworkTrust(
  ip: string,
  geo: GeoResult | null,
  signals: Record<string, unknown>,
): { score: number; codes: string[]; chargebackHints: number; promoHints: number } {
  let score = 75;
  const codes: string[] = [];
  let chargebackHints = 0;
  let promoHints = 0;

  const isPrivate = !ip || ip === "127.0.0.1" || ip === "::1" || ip === ""
    || ip.startsWith("10.") || ip.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

  if (isPrivate) return { score: 70, codes, chargebackHints, promoHints };

  const isProxy = Boolean(signals["proxy"] ?? false);
  const isVpn = Boolean(signals["vpn"] ?? false);
  const isDatacenter = Boolean(signals["datacenter_ip"] ?? false);

  if (isDatacenter) {
    score -= 30; codes.push("datacenter_ip_risk");
    chargebackHints += 25; promoHints += 20;
  }
  if (isProxy) {
    score -= 25; codes.push("proxy_network_risk");
    chargebackHints += 20; promoHints += 20;
  }
  if (isVpn) {
    score -= 15; codes.push("vpn_network_risk");
    chargebackHints += 10; promoHints += 10;
  }

  if (!geo || !geo.country) {
    score -= 15; codes.push("unresolvable_geography");
    chargebackHints += 10;
  } else {
    const HIGH_RISK_COUNTRIES = ["NG", "GH", "CI", "CM", "SN", "ML", "BF", "TG", "BJ"];
    const ELEVATED_RISK = ["IN", "PK", "BD", "VN", "KH", "MM", "RU", "UA", "BY", "MD", "BY"];
    if (HIGH_RISK_COUNTRIES.includes(geo.country)) {
      score -= 20; codes.push("high_risk_geography");
      chargebackHints += 20; promoHints += 15;
    } else if (ELEVATED_RISK.includes(geo.country)) {
      score -= 10; codes.push("elevated_risk_geography");
      chargebackHints += 10;
    } else {
      score += 10;
    }
  }

  return { score: clamp(score), codes, chargebackHints, promoHints };
}

// ── 3. Traffic Quality (20%) ───────────────────────────────────────────────
// Fraudulent traffic patterns strongly correlate with payment fraud.

function scoreTrafficQuality(
  trafficResult: TrafficScoreResult,
): { score: number; codes: string[]; refundHints: number; promoHints: number } {
  let score = 60;
  const codes: string[] = [];
  let refundHints = 0;
  let promoHints = 0;

  const tts = trafficResult.trafficTrustScore;
  if (tts >= 800) { score += 30; }
  else if (tts >= 650) { score += 15; }
  else if (tts >= 500) { score += 0; }
  else if (tts >= 350) { score -= 15; codes.push("low_traffic_quality"); refundHints += 10; }
  else { score -= 30; codes.push("fraudulent_traffic_pattern"); refundHints += 20; promoHints += 15; }

  const sourceScore = trafficResult.trafficSourceScore;
  const convScore = trafficResult.trafficConversionScore;

  if (sourceScore < 40) { score -= 10; codes.push("suspicious_traffic_source"); promoHints += 10; }
  if (convScore < 40) { score -= 10; codes.push("conversion_anomaly_detected"); }

  const trcodes = trafficResult.reasonCodes;
  if (trcodes.includes("source_mismatch")) { score -= 8; promoHints += 10; }
  if (trcodes.includes("conversion_too_fast")) { score -= 12; promoHints += 15; }
  if (trcodes.includes("burst_pattern")) { score -= 10; promoHints += 10; }
  if (trcodes.includes("repeat_fingerprint")) { score -= 8; }

  return { score: clamp(score), codes, refundHints, promoHints };
}

// ── 4. Behavioral–Financial Correlation (20%) ──────────────────────────────
// Low engagement before a purchase/conversion is a strong financial fraud signal.

function scoreBehavioralFinancial(
  behavior: Record<string, unknown>,
  eventType: string,
  conversionValue: number | null,
): { score: number; codes: string[]; chargebackHints: number } {
  let score = 65;
  const codes: string[] = [];
  let chargebackHints = 0;

  const mouseCount = Number(behavior["mouse_event_count"] ?? 0);
  const clickCount = Number(behavior["click_count"] ?? 0);
  const keyCount = Number(behavior["key_event_count"] ?? 0);
  const scrollCount = Number(behavior["scroll_event_count"] ?? 0);
  const sessionMs = Number(behavior["session_duration_ms"] ?? 0);

  const totalInteractions = mouseCount + clickCount + keyCount + scrollCount;
  const isConversion = eventType === "conversion" || eventType === "purchase_attempt";

  if (isConversion) {
    if (totalInteractions === 0) {
      score -= 30; codes.push("zero_engagement_conversion");
      chargebackHints += 25;
    } else if (totalInteractions < 5) {
      score -= 15; codes.push("low_engagement_conversion");
      chargebackHints += 10;
    } else if (totalInteractions > 20) {
      score += 15;
    }

    if (sessionMs > 0 && sessionMs < 1000) {
      score -= 20; codes.push("instant_conversion");
      chargebackHints += 20;
    } else if (sessionMs > 5000) {
      score += 10;
    }

    if (conversionValue != null && conversionValue > 500) {
      if (totalInteractions < 3) {
        score -= 15; codes.push("high_value_low_engagement");
        chargebackHints += 15;
      }
    }
  } else {
    if (mouseCount > 20) score += 10;
    if (scrollCount > 5) score += 5;
    if (keyCount > 0) score += 5;
    if (totalInteractions === 0 && sessionMs > 2000) {
      score -= 10;
    }
  }

  return { score: clamp(score), codes, chargebackHints };
}

// ── 5. Identity Signals (15%) ──────────────────────────────────────────────
// Profile completeness and consistency reduce impersonation and synthetic ID risk.

function scoreIdentitySignals(
  signals: Record<string, unknown>,
  utm: Record<string, string | null | undefined>,
): { score: number; codes: string[] } {
  let score = 70;
  const codes: string[] = [];

  const ua = String(signals["user_agent"] ?? "");
  if (!ua || ua === "" || ua === "undefined") {
    score -= 20; codes.push("missing_identity_signals");
  } else {
    const BOT_PATTERNS = ["bot", "crawl", "python", "curl", "wget", "java/", "scrapy", "node-fetch", "axios/"];
    if (BOT_PATTERNS.some((p) => ua.toLowerCase().includes(p))) {
      score -= 25; codes.push("scripted_identity");
    }
  }

  const timezone = String(signals["timezone"] ?? "");
  const hwConcurrency = Number(signals["hardware_concurrency"] ?? 0);
  const deviceMemory = signals["device_memory"];
  const screenW = Number(signals["screen_width"] ?? 0);

  if (!timezone) { score -= 8; codes.push("missing_identity_signals"); }
  if (hwConcurrency === 0) { score -= 8; }
  if (deviceMemory != null) { score += 5; }
  if (screenW > 0) { score += 5; }

  const hasUtmIntegrity = utm.source && utm.medium && utm.campaign;
  if (hasUtmIntegrity) score += 10;

  return { score: clamp(score), codes };
}

// ── Derived risk scores ────────────────────────────────────────────────────

function deriveRiskScores(
  protectionScore: number,
  chargebackHints: number,
  refundHints: number,
  promoHints: number,
  humanClassification: string,
): { chargebackRisk: number; refundAbuse: number; promoAbuse: number; billingAnomaly: number } {
  const baseRisk = clamp(100 - protectionScore);

  const chargebackRisk = clamp(baseRisk * 0.7 + Math.min(40, chargebackHints));
  const refundAbuse = clamp(baseRisk * 0.6 + Math.min(30, refundHints));
  const promoAbuse = clamp(baseRisk * 0.5 + Math.min(35, promoHints));

  const billingAnomaly = clamp(
    (chargebackRisk * 0.4 + refundAbuse * 0.3 + promoAbuse * 0.3)
    + (humanClassification === "bot" ? 20 : humanClassification === "automation" ? 10 : 0)
  );

  return { chargebackRisk, refundAbuse, promoAbuse, billingAnomaly };
}

// ── Classification ─────────────────────────────────────────────────────────

function classifyRiskTier(score: number): RevenueRiskTier {
  if (score >= 80) return "safe";
  if (score >= 65) return "low";
  if (score >= 50) return "moderate";
  if (score >= 35) return "elevated";
  return "high";
}

function decideAction(score: number): RevenueDecision {
  if (score >= 80) return "approve";
  if (score >= 65) return "approve_and_monitor";
  if (score >= 50) return "delay_fulfillment";
  if (score >= 35) return "step_up_verification";
  return "block_transaction";
}

// ── Main export ────────────────────────────────────────────────────────────

export function scoreRevenueProtection(params: {
  humanResult: HumanScoreResult;
  trafficResult: TrafficScoreResult;
  signals: Record<string, unknown>;
  behavior: Record<string, unknown>;
  geo: GeoResult | null;
  ip: string;
  utm: Record<string, string | null | undefined>;
  eventType: string;
  conversionValue: number | null;
}): RevenueScoreResult {
  const { humanResult, trafficResult, signals, behavior, geo, ip, utm, eventType, conversionValue } = params;

  const {
    score: siScore,
    codes: siCodes,
    chargebackHints: siCB,
    refundHints: siRefund,
    promoHints: siPromo,
  } = scoreSessionIntegrity(humanResult, signals, behavior);

  const {
    score: ntScore,
    codes: ntCodes,
    chargebackHints: ntCB,
    promoHints: ntPromo,
  } = scoreNetworkTrust(ip, geo, signals);

  const {
    score: tqScore,
    codes: tqCodes,
    refundHints: tqRefund,
    promoHints: tqPromo,
  } = scoreTrafficQuality(trafficResult);

  const {
    score: bfScore,
    codes: bfCodes,
    chargebackHints: bfCB,
  } = scoreBehavioralFinancial(behavior, eventType, conversionValue);

  const { score: isScore, codes: isCodes } = scoreIdentitySignals(signals, utm);

  const revenueProtectionScore = clamp(
    0.25 * siScore
    + 0.20 * ntScore
    + 0.20 * tqScore
    + 0.20 * bfScore
    + 0.15 * isScore,
  );

  const totalChargebackHints = siCB + ntCB + bfCB;
  const totalRefundHints = siRefund + tqRefund;
  const totalPromoHints = siPromo + ntPromo + tqPromo;

  const { chargebackRisk, refundAbuse, promoAbuse, billingAnomaly } = deriveRiskScores(
    revenueProtectionScore,
    totalChargebackHints,
    totalRefundHints,
    totalPromoHints,
    humanResult.humanClassification,
  );

  const revenueRiskTier = classifyRiskTier(revenueProtectionScore);
  const revenueDecision = decideAction(revenueProtectionScore);

  const allCodes = [...new Set([...siCodes, ...ntCodes, ...tqCodes, ...bfCodes, ...isCodes])];

  return {
    revenueProtectionScore,
    chargebackRiskScore: chargebackRisk,
    refundAbuseScore: refundAbuse,
    promoAbuseScore: promoAbuse,
    billingAnomalyScore: billingAnomaly,
    revenueDecision,
    revenueRiskTier,
    sessionIntegrityScore: siScore,
    networkTrustScore: ntScore,
    trafficQualityScore: tqScore,
    behavioralFinancialScore: bfScore,
    identitySignalsScore: isScore,
    reasonCodes: allCodes.slice(0, 5),
  };
}
