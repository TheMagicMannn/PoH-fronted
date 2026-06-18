/**
 * Traffic Intelligence Engine (TIEg)
 *
 * Formula (per spec):
 *   traffic_trust_score (0–1000) =
 *     (source_intelligence        * 0.15)
 *   + (campaign_intelligence      * 0.15)
 *   + (engagement_intelligence    * 0.15)
 *   + (conversion_integrity       * 0.15)
 *   + (referral_intelligence      * 0.10)
 *   + (geographic_intelligence    * 0.10)
 *   + (temporal_intelligence      * 0.10)
 *   + (device_network_validation  * 0.10)
 *
 *   All sub-scores are 0–100; composite is scaled × 10 to reach 0–1000.
 */

export type TrafficRiskTier = "low" | "medium" | "elevated" | "high" | "critical";
export type TrafficDecision =
  | "allow"
  | "allow_and_monitor"
  | "deprioritize"
  | "challenge"
  | "block_source";

export interface TrafficScoreResult {
  trafficTrustScore: number;
  trafficQualityScore: number;
  trafficFraudScore: number;
  trafficConfidence: number;
  trafficRiskTier: TrafficRiskTier;
  trafficDecision: TrafficDecision;
  trafficSourceScore: number;
  trafficCampaignScore: number;
  trafficEngagementScore: number;
  trafficConversionScore: number;
  trafficReferralScore: number;
  trafficGeoScore: number;
  trafficTemporalScore: number;
  trafficDeviceNetworkScore: number;
  reasonCodes: string[];
}

export interface TrafficScoreInput {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  adSet?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  signals?: Record<string, unknown>;
  behavior?: Record<string, unknown>;
  geo?: { country?: string; city?: string; ll?: number[] } | null;
  ip?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ── Source Intelligence (15%) ──────────────────────────────────────────────
function scoreSource(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 50;
  const codes: string[] = [];
  const src = (i.source ?? "direct").toLowerCase();
  const med = (i.medium ?? "").toLowerCase();
  const sig = i.signals ?? {};

  const knownSources = ["google", "bing", "facebook", "meta", "twitter", "linkedin",
    "tiktok", "youtube", "email", "direct", "organic", "newsletter"];
  if (knownSources.includes(src)) s += 15;
  else if (!src || src === "unknown") { s -= 15; codes.push("unknown_source"); }

  const knownMediums = ["cpc", "paid_social", "organic", "email", "social",
    "display", "affiliate", "referral", "direct", "none", "sms", "push"];
  if (med && knownMediums.includes(med)) s += 10;

  const isPaid = ["cpc", "paid_social", "paid_search", "display", "affiliate"].includes(med);
  if (isPaid && !i.campaign) { s -= 25; codes.push("source_mismatch"); }

  if (med === "referral" && !i.referrer) { s -= 10; codes.push("source_mismatch"); }

  const hasWebdriver = Boolean(sig["webdriver"]);
  const headlessScore = Number(sig["headless_score"] ?? 0);
  if (src === "direct" && (hasWebdriver || headlessScore > 0.5)) {
    s -= 20;
    if (!codes.includes("source_mismatch")) codes.push("source_mismatch");
  }

  return { score: clamp(s), codes };
}

// ── Campaign Intelligence (15%) ────────────────────────────────────────────
function scoreCampaign(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 55;
  const codes: string[] = [];
  const src = (i.source ?? "").toLowerCase();
  const med = (i.medium ?? "").toLowerCase();

  if (i.campaign) s += 15;
  if (i.adSet) s += 10;
  if (i.source && i.medium && i.campaign) s += 10;

  const isPaid = ["cpc", "paid_social", "paid_search", "display"].includes(med);
  if (isPaid && !i.campaign) { s -= 25; codes.push("campaign_spike"); }

  const paidSources = ["google", "meta", "facebook", "bing", "tiktok", "twitter"];
  if (paidSources.includes(src) && !i.medium) { s -= 15; codes.push("campaign_spike"); }

  if (med === "cpc" && !i.adSet) s -= 5;

  return { score: clamp(s), codes };
}

// ── Engagement Intelligence (15%) ──────────────────────────────────────────
function scoreEngagement(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 50;
  const codes: string[] = [];
  const sig = i.signals ?? {};
  const beh = i.behavior ?? {};

  const timeOnPage = Number(sig["time_on_page"] ?? beh["time_on_page"] ?? 0);
  const scrollDepth = Number(sig["scroll_depth"] ?? sig["scroll_depth_percent"]
    ?? beh["scroll_depth_percent"] ?? 0);
  const interactionDepth = Number(sig["interaction_depth"] ?? 0);
  const mouseEvents = Number(beh["mouse_event_count"] ?? 0);
  const keyEvents = Number(beh["key_event_count"] ?? 0);
  const scrollEvents = Number(beh["scroll_event_count"] ?? 0);

  if (timeOnPage > 0) {
    if (timeOnPage < 2)      { s -= 30; codes.push("instant_bounce_timing"); }
    else if (timeOnPage < 10)  s += 5;
    else if (timeOnPage < 60)  s += 15;
    else                       s += 20;
  }

  if (scrollDepth <= 0 && interactionDepth === 0) { s -= 15; codes.push("low_engagement"); }
  else if (scrollDepth > 0) {
    if (scrollDepth <= 30)  s += 5;
    else if (scrollDepth <= 70) s += 15;
    else                    s += 20;
  }

  if (interactionDepth <= 0)    { s -= 20; codes.push("low_engagement"); }
  else if (interactionDepth <= 2) s += 0;
  else if (interactionDepth <= 5) s += 10;
  else                            s += 15;

  if (mouseEvents > 5)  s += 10;
  if (keyEvents > 0)    s += 5;
  if (scrollEvents > 3) s += 5;

  return { score: clamp(s), codes };
}

// ── Conversion Integrity (15%) ─────────────────────────────────────────────
function scoreConversion(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 70;
  const codes: string[] = [];
  const beh = i.behavior ?? {};

  const firstMs     = Number(beh["first_interaction_ms"] ?? 0);
  const sessionMs   = Number(beh["session_duration_ms"] ?? 0);
  const pasteCount  = Number(beh["paste_count"] ?? 0);
  const keyEvents   = Number(beh["key_event_count"] ?? 0);
  const mouseEvents = Number(beh["mouse_event_count"] ?? 0);

  if (firstMs > 0) {
    if (firstMs < 500) { s -= 30; codes.push("conversion_too_fast"); }
    else if (firstMs >= 2000) s += 10;
  }

  if (sessionMs > 0) {
    if (sessionMs < 1000) { s -= 25; codes.push("conversion_too_fast"); }
    else if (sessionMs >= 5000) s += 10;
  }

  if (pasteCount > 0 && keyEvents === 0) { s -= 20; codes.push("suspicious_attribution"); }

  if (mouseEvents === 0 && sessionMs > 1000) { s -= 15; codes.push("low_engagement"); }

  return { score: clamp(s), codes };
}

// ── Referral Intelligence (10%) ────────────────────────────────────────────
function scoreReferral(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 60;
  const codes: string[] = [];
  const med = (i.medium ?? "").toLowerCase();
  const ref = i.referrer ?? "";

  const trustedDomains = ["google.com", "bing.com", "yahoo.com", "facebook.com",
    "instagram.com", "twitter.com", "x.com", "linkedin.com", "youtube.com",
    "t.co", "reddit.com", "pinterest.com", "tiktok.com"];

  if (ref) {
    const refDomain = ref.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase() ?? "";
    const trusted = trustedDomains.some((d) => refDomain.endsWith(d));
    if (trusted) s += 20;
    else s += 8;
    const src = (i.source ?? "").toLowerCase();
    if (src && refDomain.includes(src)) s += 10;
  } else {
    if (med === "referral") { s -= 20; codes.push("referral_loop"); }
    if (["organic", "cpc"].includes(med) && !ref) s -= 5;
  }

  return { score: clamp(s), codes };
}

// ── Geographic Intelligence (10%) ──────────────────────────────────────────
function scoreGeo(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 65;
  const codes: string[] = [];
  const sig = i.signals ?? {};

  const isProxy     = Boolean(sig["proxy"] ?? false);
  const isVpn       = Boolean(sig["vpn"] ?? false);
  const isDatacenter = Boolean(sig["datacenter_ip"] ?? false);

  if (i.geo) s += 15;
  else { s -= 10; codes.push("geo_inconsistency"); }

  if (isDatacenter) { s -= 30; codes.push("datacenter_network"); }
  if (isProxy)      { s -= 25; codes.push("datacenter_network"); }
  if (isVpn)        { s -= 20; codes.push("datacenter_network"); }

  const highRiskCountries = ["IN", "PK", "RU", "NG", "BD", "VN", "KH", "MM"];
  if (i.geo?.country && highRiskCountries.includes(i.geo.country)) s -= 10;

  return { score: clamp(s), codes };
}

// ── Temporal Intelligence (10%) ────────────────────────────────────────────
function scoreTemporal(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 65;
  const codes: string[] = [];
  const beh = i.behavior ?? {};

  const sessionMs     = Number(beh["session_duration_ms"] ?? 0);
  const firstMs       = Number(beh["first_interaction_ms"] ?? 0);
  const avgKeystroke  = Number(beh["avg_keystroke_ms"] ?? 0);
  const interKeyVar   = Number(beh["inter_key_variance"] ?? 0);

  if (sessionMs > 0) {
    if (sessionMs < 1000)   { s -= 30; codes.push("burst_pattern"); }
    else if (sessionMs > 2000) s += 15;
  }

  if (firstMs > 0) {
    if (firstMs < 200)                    { s -= 20; codes.push("burst_pattern"); }
    else if (firstMs > 1000 && firstMs < 30000) s += 15;
  }

  if (avgKeystroke > 0 && avgKeystroke < 50 && interKeyVar < 10) {
    s -= 15;
    codes.push("burst_pattern");
  }

  return { score: clamp(s), codes };
}

// ── Device / Network Cross-Validation (10%) ────────────────────────────────
function scoreDeviceNetwork(i: TrafficScoreInput): { score: number; codes: string[] } {
  let s = 65;
  const codes: string[] = [];
  const sig = i.signals ?? {};

  const isProxy      = Boolean(sig["proxy"] ?? false);
  const isVpn        = Boolean(sig["vpn"] ?? false);
  const isDatacenter = Boolean(sig["datacenter_ip"] ?? false);
  const hasWebdriver = Boolean(sig["webdriver"] ?? false);
  const headlessScore = Number(sig["headless_score"] ?? 0);
  const headless     = Boolean(sig["headless"] ?? headlessScore > 0.7);
  const automationMarkers = (sig["automation_markers"] as string[] | undefined) ?? [];

  if (isProxy)      s -= 10;
  if (isVpn)        s -= 10;
  if (isDatacenter) s -= 15;

  if (hasWebdriver) { s -= 30; codes.push("repeat_fingerprint"); }
  if (headless)     { s -= 25; if (!codes.includes("repeat_fingerprint")) codes.push("repeat_fingerprint"); }
  if (automationMarkers.length > 0) {
    s -= 15;
    if (!codes.includes("repeat_fingerprint")) codes.push("repeat_fingerprint");
  }

  if (i.browser)    s += 5;
  if (i.deviceType) s += 5;
  if (i.landingPage || i.referrer) s += 5;

  return { score: clamp(s), codes };
}

// ── Confidence Estimation ──────────────────────────────────────────────────
function estimateConfidence(i: TrafficScoreInput): number {
  let conf = 0.5;
  if (i.source)      conf += 0.05;
  if (i.medium)      conf += 0.05;
  if (i.campaign)    conf += 0.05;
  if (i.geo)         conf += 0.05;
  if (i.referrer)    conf += 0.05;
  const beh = i.behavior ?? {};
  if (Number(beh["session_duration_ms"] ?? 0) > 0) conf += 0.05;
  if (Number(beh["mouse_event_count"] ?? 0) > 0)   conf += 0.05;
  const sig = i.signals ?? {};
  if (Number(sig["time_on_page"] ?? 0) > 0)        conf += 0.05;
  if (Number(sig["scroll_depth"] ?? 0) > 0)        conf += 0.05;
  if (i.deviceType && i.browser)                   conf += 0.05;
  return Math.round(Math.min(0.98, conf) * 100) / 100;
}

// ── Risk tier & decision ───────────────────────────────────────────────────
function classifyRiskTier(score: number): TrafficRiskTier {
  if (score >= 800) return "low";
  if (score >= 650) return "medium";
  if (score >= 500) return "elevated";
  if (score >= 300) return "high";
  return "critical";
}

function decideAction(score: number): TrafficDecision {
  if (score >= 850) return "allow";
  if (score >= 700) return "allow_and_monitor";
  if (score >= 550) return "deprioritize";
  if (score >= 400) return "challenge";
  return "block_source";
}

// ── Main export ────────────────────────────────────────────────────────────
export function scoreTrafficIntelligence(input: TrafficScoreInput): TrafficScoreResult {
  const src  = scoreSource(input);
  const camp = scoreCampaign(input);
  const eng  = scoreEngagement(input);
  const conv = scoreConversion(input);
  const ref  = scoreReferral(input);
  const geo  = scoreGeo(input);
  const temp = scoreTemporal(input);
  const dn   = scoreDeviceNetwork(input);

  const composite =
    src.score  * 0.15 +
    camp.score * 0.15 +
    eng.score  * 0.15 +
    conv.score * 0.15 +
    ref.score  * 0.10 +
    geo.score  * 0.10 +
    temp.score * 0.10 +
    dn.score   * 0.10;

  const trafficTrustScore = clamp(Math.round(composite * 10), 0, 1000);
  const trafficQualityScore = clamp(Math.round(composite));
  const trafficFraudScore   = clamp(100 - trafficQualityScore);
  const trafficRiskTier     = classifyRiskTier(trafficTrustScore);
  const trafficDecision     = decideAction(trafficTrustScore);
  const trafficConfidence   = estimateConfidence(input);

  const allCodes = [
    ...src.codes, ...camp.codes, ...eng.codes, ...conv.codes,
    ...ref.codes, ...geo.codes, ...temp.codes, ...dn.codes,
  ];
  const reasonCodes = [...new Set(allCodes)];

  return {
    trafficTrustScore,
    trafficQualityScore,
    trafficFraudScore,
    trafficConfidence,
    trafficRiskTier,
    trafficDecision,
    trafficSourceScore: src.score,
    trafficCampaignScore: camp.score,
    trafficEngagementScore: eng.score,
    trafficConversionScore: conv.score,
    trafficReferralScore: ref.score,
    trafficGeoScore: geo.score,
    trafficTemporalScore: temp.score,
    trafficDeviceNetworkScore: dn.score,
    reasonCodes,
  };
}
