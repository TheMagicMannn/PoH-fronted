/**
 * Trust Intelligence Engine (TIE) — Composite Scorer
 *
 * Combines all four sub-engine outputs into a unified 0–1000 trust score.
 *
 * Module weights (per TIE spec):
 *   Human Intelligence:     20%
 *   Behavioral Intelligence: 15%
 *   Device Intelligence:    15%
 *   Network Intelligence:   10%
 *   Identity Intelligence:  10%
 *   Traffic Intelligence:   10%
 *   Graph Intelligence:     10%
 *   Fraud (inverse):        10%
 *
 * Formula: tieTrustScore = Σ(module_score_0_100 × weight) × 10  → range 0–1000
 */

export type TIERiskTier =
  | "elite_trust"
  | "trusted"
  | "verified"
  | "low_risk"
  | "neutral"
  | "suspicious"
  | "high_risk"
  | "fraudulent";

export type TIEDecision =
  | "allow"
  | "allow_and_monitor"
  | "step_up"
  | "review"
  | "block"
  | "quarantine";

export interface TIEInput {
  // Human Authenticity Engine outputs
  humanScore: number;             // 0–100
  behaviorScore: number;          // 0–100
  browserIntegrityScore: number;  // 0–100
  deviceConsistencyScore: number; // 0–100
  networkScore: number;           // 0–100 (network reputation from human engine)
  historicalScore: number;        // 0–100

  // Traffic Intelligence Engine outputs
  trafficQualityScore: number;    // 0–100
  trafficFraudScore: number;      // 0–100 (fraud probability from traffic)
  trafficCampaignScore: number;   // 0–100

  // Revenue Protection Engine outputs
  revenueProtectionScore: number; // 0–100
  networkTrustScore: number;      // 0–100 (network trust from revenue engine)
  identitySignalsScore: number;   // 0–100
  sessionIntegrityScore: number;  // 0–100

  // Device Intelligence Engine outputs
  deviceIntelScore: number;       // 0–100
  deviceVelocityScore: number;    // 0–100
  deviceFraudRateScore: number;   // 0–100
  deviceSpreadScore: number;      // 0–100

  // Existing aggregate
  existingFraudScore: number;     // 0–100 raw fraud probability
  confidence: number;             // 0–1 overall confidence

  // All collected reason codes from sub-engines
  allReasonCodes: string[];
}

export interface TIEResult {
  tieTrustScore: number;          // 0–1000
  tieHumanScore: number;          // 0–100 human module
  tieBehaviorScore: number;       // 0–100 behavioral module
  tieDeviceScore: number;         // 0–100 device module
  tieNetworkScore: number;        // 0–100 network module
  tieIdentityScore: number;       // 0–100 identity module
  tieTrafficScore: number;        // 0–100 traffic module
  tieGraphScore: number;          // 0–100 graph/relationship module
  tieFraudInverseScore: number;   // 0–100 fraud inverse module
  tieFraudScore: number;          // 0–100 overall fraud probability
  tieConfidence: number;          // 0–1
  tieRiskTier: TIERiskTier;
  tieDecision: TIEDecision;
  tieReasonCodes: string[];
  topPositiveSignals: string[];
  topNegativeSignals: string[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function avg(...values: number[]): number {
  const valid = values.filter((v) => v != null && !isNaN(v));
  if (valid.length === 0) return 50;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function riskTier(score: number): TIERiskTier {
  if (score >= 900) return "elite_trust";
  if (score >= 800) return "trusted";
  if (score >= 700) return "verified";
  if (score >= 600) return "low_risk";
  if (score >= 500) return "neutral";
  if (score >= 400) return "suspicious";
  if (score >= 300) return "high_risk";
  return "fraudulent";
}

function decisionFromScore(trustScore: number, fraudScore: number): TIEDecision {
  if (trustScore < 400 || fraudScore >= 80) return fraudScore >= 90 ? "quarantine" : "block";
  if (trustScore < 550) return "review";
  if (trustScore < 700) return "step_up";
  if (trustScore < 850) return "allow_and_monitor";
  return "allow";
}

const POSITIVE_SIGNAL_LABELS: Record<string, string> = {
  high_human_score: "Strong human authenticity signals",
  natural_behavior: "Natural mouse, keyboard and scroll behavior",
  clean_device: "Device fingerprint is stable and clean",
  trusted_network: "IP and network reputation is trusted",
  residential_ip: "Residential IP — consistent with genuine user",
  low_fraud_history: "No historical fraud indicators on this device",
  consistent_identity: "Identity signals are consistent",
  organic_traffic: "Organic or verified paid traffic source",
  high_engagement: "Genuine engagement depth and dwell time",
  verified_browser: "Browser environment passes integrity checks",
};

const NEGATIVE_SIGNAL_LABELS: Record<string, string> = {
  low_human_score: "Low human authenticity score",
  robotic_behavior: "Behavioral signals suggest automation",
  suspicious_device: "Device fingerprint shows risk indicators",
  datacenter_ip: "Traffic originating from datacenter or hosting IP",
  vpn_proxy: "VPN or proxy usage detected",
  high_fraud_history: "Historical fraud patterns on this device",
  weak_identity: "Identity signals are sparse or suspicious",
  bot_traffic_source: "Traffic source associated with bot or invalid traffic",
  low_engagement: "Very low engagement — no scroll, click or time on page",
  automation_detected: "Browser automation framework indicators found",
};

export function scoreTrustIntelligence(input: TIEInput): TIEResult {
  // ── Module scores (0–100) ─────────────────────────────────────────────────

  // 1. Human module — human score from human engine
  const tieHuman = clamp(input.humanScore);

  // 2. Behavioral module — behavior score + browser integrity weighted
  const tieBehavior = clamp(avg(input.behaviorScore * 0.6 + input.browserIntegrityScore * 0.4));

  // 3. Device module — device intel score weighted with consistency
  const tieDevice = clamp(avg(
    input.deviceIntelScore * 0.5,
    input.deviceConsistencyScore * 0.3,
    input.deviceFraudRateScore * 0.2,
  ) * (10 / 3));

  // 4. Network module — combine both network scores
  const tieNetwork = clamp(avg(input.networkScore, input.networkTrustScore));

  // 5. Identity module — identity signals from revenue engine + historical auth
  const tieIdentity = clamp(avg(
    input.identitySignalsScore * 0.6,
    input.historicalScore * 0.4,
  ) * (10 / 6));

  // 6. Traffic module — traffic quality from traffic engine
  const tieTraffic = clamp(avg(
    input.trafficQualityScore * 0.6,
    input.trafficCampaignScore * 0.4,
  ) * (10 / 6));

  // 7. Graph module — derive from device velocity, spread, fraud rate, and session integrity
  const tieGraph = clamp(avg(
    input.deviceVelocityScore * 0.35,
    input.deviceFraudRateScore * 0.35,
    input.sessionIntegrityScore * 0.30,
  ) * (10 / 3.5));

  // 8. Fraud inverse module — invert the combined fraud signal
  const rawFraudProb = clamp(avg(
    input.existingFraudScore,
    input.trafficFraudScore * 0.4,
    (100 - input.revenueProtectionScore) * 0.3,
  ) * (10 / 1.7));
  const tieFraudInverse = clamp(100 - rawFraudProb);

  // ── Composite score (0–1000) ──────────────────────────────────────────────
  const rawComposite =
    tieHuman      * 0.20 +
    tieBehavior   * 0.15 +
    tieDevice     * 0.15 +
    tieNetwork    * 0.10 +
    tieIdentity   * 0.10 +
    tieTraffic    * 0.10 +
    tieGraph      * 0.10 +
    tieFraudInverse * 0.10;

  // Confidence penalty: low confidence biases toward neutral/review
  const confidencePenalty = input.confidence >= 0.85 ? 1.0 : input.confidence >= 0.65 ? 0.95 : 0.88;
  const tieTrustScore = Math.min(1000, Math.max(0, Math.round(rawComposite * 10 * confidencePenalty)));

  // ── Fraud score ───────────────────────────────────────────────────────────
  const tieFraud = clamp(rawFraudProb);

  // ── Tier & decision ───────────────────────────────────────────────────────
  const tier = riskTier(tieTrustScore);
  const decision = decisionFromScore(tieTrustScore, tieFraud);

  // ── Confidence ────────────────────────────────────────────────────────────
  const tieConf = Math.min(1, (input.confidence * 0.7) + (Math.min(input.allReasonCodes.length, 5) * 0.06));

  // ── TIE-level reason codes ────────────────────────────────────────────────
  const tieReasonCodes: string[] = [];
  if (tieTrustScore >= 800) tieReasonCodes.push("tie_high_trust_composite");
  if (tieTrustScore < 500) tieReasonCodes.push("tie_low_trust_composite");
  if (tieNetwork < 40) tieReasonCodes.push("tie_network_risk");
  if (tieBehavior < 40) tieReasonCodes.push("tie_behavioral_anomaly");
  if (tieDevice < 40) tieReasonCodes.push("tie_device_risk");
  if (tieGraph < 35) tieReasonCodes.push("tie_graph_cluster_risk");
  if (tieIdentity < 35) tieReasonCodes.push("tie_identity_weakness");
  if (tieFraud >= 70) tieReasonCodes.push("tie_high_fraud_probability");
  if (input.confidence < 0.6) tieReasonCodes.push("tie_low_signal_confidence");

  // ── Top signals ────────────────────────────────────────────────────────────
  const positive: string[] = [];
  const negative: string[] = [];

  if (tieHuman >= 75) positive.push(POSITIVE_SIGNAL_LABELS.high_human_score);
  if (tieBehavior >= 75) positive.push(POSITIVE_SIGNAL_LABELS.natural_behavior);
  if (tieDevice >= 75) positive.push(POSITIVE_SIGNAL_LABELS.clean_device);
  if (tieNetwork >= 75) positive.push(POSITIVE_SIGNAL_LABELS.trusted_network);
  if (tieIdentity >= 70) positive.push(POSITIVE_SIGNAL_LABELS.consistent_identity);
  if (tieTraffic >= 70) positive.push(POSITIVE_SIGNAL_LABELS.organic_traffic);
  if (tieGraph >= 70) positive.push(POSITIVE_SIGNAL_LABELS.low_fraud_history);

  if (tieHuman < 40) negative.push(NEGATIVE_SIGNAL_LABELS.low_human_score);
  if (tieBehavior < 40) negative.push(NEGATIVE_SIGNAL_LABELS.robotic_behavior);
  if (tieDevice < 40) negative.push(NEGATIVE_SIGNAL_LABELS.suspicious_device);
  if (tieNetwork < 40) {
    const hasDatacenter = input.allReasonCodes.some(c => c.includes("datacenter"));
    const hasVpn = input.allReasonCodes.some(c => c.includes("vpn") || c.includes("proxy"));
    if (hasDatacenter) negative.push(NEGATIVE_SIGNAL_LABELS.datacenter_ip);
    else if (hasVpn) negative.push(NEGATIVE_SIGNAL_LABELS.vpn_proxy);
    else negative.push(NEGATIVE_SIGNAL_LABELS.trusted_network.replace("is trusted", "is suspicious"));
  }
  if (tieIdentity < 35) negative.push(NEGATIVE_SIGNAL_LABELS.weak_identity);
  if (tieTraffic < 40) negative.push(NEGATIVE_SIGNAL_LABELS.bot_traffic_source);
  if (tieFraud >= 65) negative.push(NEGATIVE_SIGNAL_LABELS.high_fraud_history);
  if (input.allReasonCodes.some(c => c.includes("automation") || c.includes("headless") || c.includes("webdriver"))) {
    negative.push(NEGATIVE_SIGNAL_LABELS.automation_detected);
  }

  return {
    tieTrustScore,
    tieHumanScore: tieHuman,
    tieBehaviorScore: tieBehavior,
    tieDeviceScore: tieDevice,
    tieNetworkScore: tieNetwork,
    tieIdentityScore: tieIdentity,
    tieTrafficScore: tieTraffic,
    tieGraphScore: tieGraph,
    tieFraudInverseScore: tieFraudInverse,
    tieFraudScore: tieFraud,
    tieConfidence: Math.round(tieConf * 100) / 100,
    tieRiskTier: tier,
    tieDecision: decision,
    tieReasonCodes,
    topPositiveSignals: positive.slice(0, 4),
    topNegativeSignals: negative.slice(0, 4),
  };
}
