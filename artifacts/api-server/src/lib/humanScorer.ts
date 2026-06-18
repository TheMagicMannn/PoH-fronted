/**
 * Human Authenticity Intelligence Engine
 *
 * Formula (per spec):
 *   human_score = 0.25 * browser_integrity
 *               + 0.25 * human_behavior
 *               + 0.15 * device_consistency
 *               + 0.20 * network_reputation
 *               + 0.15 * historical_authenticity
 */

import { db, sessionsTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";

export type HumanClassification = "human" | "suspicious_human" | "automation" | "bot" | "uncertain";
export type HumanDecision = "allow" | "step_up" | "challenge" | "block";

export interface HumanScoreResult {
  humanScore: number;
  humanConfidence: number;
  humanClassification: HumanClassification;
  humanDecision: HumanDecision;
  browserIntegrityScore: number;
  behaviorScore: number;
  deviceConsistencyScore: number;
  networkScore: number;
  historicalScore: number;
  reasonCodes: string[];
}

interface Signals {
  webdriver?: boolean;
  headless_score?: number;
  headless_flags?: string[];
  plugins_count?: number;
  languages_count?: number;
  hardware_concurrency?: number;
  device_memory?: number;
  screen_width?: number;
  screen_height?: number;
  timezone?: string;
  user_agent?: string;
  touch_support?: boolean;
  is_mobile?: boolean;
  automation_markers?: string[];
  [k: string]: unknown;
}

interface Behavior {
  mouse_event_count?: number;
  click_count?: number;
  key_event_count?: number;
  scroll_event_count?: number;
  paste_count?: number;
  idle_periods?: number;
  session_duration_ms?: number;
  first_interaction_ms?: number;
  scroll_depth_percent?: number;
  avg_keystroke_ms?: number;
  inter_key_variance?: number;
  click_interval_entropy?: number;
  mouse_path_entropy?: number;
  scroll_variance?: number;
  focus_blur_count?: number;
  [k: string]: unknown;
}

interface GeoResult {
  country?: string | null;
  city?: string | null;
  ll?: [number, number];
}

function clamp(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

// ─── Group 1: Browser Integrity (25%) ────────────────────────────────────────

function scoreBrowserIntegrity(sig: Signals): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  if (sig.webdriver) {
    score -= 40;
    reasons.push("webdriver_detected");
  }

  const headless = Number(sig.headless_score ?? 0);
  if (headless > 50) {
    score -= 20;
    reasons.push("headless_browser_detected");
  } else if (headless > 20) {
    score -= 10;
  }

  if (Number(sig.plugins_count ?? -1) === 0) {
    score -= 10;
    reasons.push("missing_browser_plugins");
  }

  if (Number(sig.languages_count ?? -1) === 0) {
    score -= 10;
    reasons.push("no_language_preferences");
  }

  const flags = sig.headless_flags ?? [];
  if (flags.includes("zero_outer_size")) {
    score -= 15;
    reasons.push("window_metrics_anomaly");
  }

  const markers = sig.automation_markers ?? [];
  if (markers.length > 0) {
    const penalty = Math.min(30, markers.length * 15);
    score -= penalty;
    reasons.push("automation_framework_signature");
  }

  // Known bot / crawler user-agent patterns
  const ua = (sig.user_agent ?? "").toLowerCase();
  const BOT_UA_PATTERNS = [
    "bot", "crawl", "spider", "slurp", "curl/", "wget/",
    "python-requests", "python-urllib", "go-http-client",
    "java/", "scrapy", "phantomjs", "httpclient", "okhttp",
    "axios/", "node-fetch", "got/", "got ", "undici",
  ];
  if (ua !== "" && BOT_UA_PATTERNS.some((p) => ua.includes(p))) {
    score -= 50;
    reasons.push("bot_user_agent");
  }

  return { score: clamp(score), reasons };
}

// ─── Group 2: Human Behavior (25%) ───────────────────────────────────────────

function scoreBehavior(beh: Behavior): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const durationMs = Number(beh.session_duration_ms ?? 0);
  const durationSec = durationMs / 1000;

  let score = 65;

  // Mouse movement — only penalise lack of mouse on desktop (long sessions with
  // zero mouse AND zero clicks means no touch input either, so likely not a human)
  const mouseCount = Number(beh.mouse_event_count ?? 0);
  const clickCountEarly = Number(beh.click_count ?? 0);
  if (mouseCount === 0 && clickCountEarly === 0 && durationSec > 5) {
    score -= 15;
    reasons.push("cursor_entropy_low");
  } else if (mouseCount > 10) {
    score += 5;
  }

  const pathEntropy = beh.mouse_path_entropy != null ? Number(beh.mouse_path_entropy) : -1;
  if (pathEntropy >= 0) {
    if (pathEntropy < 0.1) {
      score -= 15;
      if (!reasons.includes("cursor_entropy_low")) reasons.push("cursor_entropy_low");
    } else if (pathEntropy > 0.5) {
      score += 8;
    }
  }

  // Click behavior
  const clickCount = Number(beh.click_count ?? 0);
  // Only penalise after a very long session; dashboard readers may not click at all
  if (clickCount === 0 && durationSec > 15) score -= 8;

  const clickEntropy = beh.click_interval_entropy != null ? Number(beh.click_interval_entropy) : -1;
  if (clickEntropy >= 0 && clickCount >= 2) {
    if (clickEntropy < 5) {
      score -= 20;
      reasons.push("click_pattern_robotic");
    } else if (clickEntropy > 50) {
      score += 8;
    }
  }

  // Typing dynamics
  const avgKeystroke = Number(beh.avg_keystroke_ms ?? 0);
  const keyCount = Number(beh.key_event_count ?? 0);
  if (keyCount > 3) {
    if (avgKeystroke > 0 && avgKeystroke < 30) {
      score -= 20;
      reasons.push("typing_pattern_nonhuman");
    } else if (avgKeystroke > 0 && avgKeystroke < 60) {
      score -= 10;
      reasons.push("typing_pattern_suspicious");
    } else if (avgKeystroke >= 80 && avgKeystroke < 800) {
      score += 8;
    }
  }

  const ikVariance = beh.inter_key_variance != null ? Number(beh.inter_key_variance) : -1;
  if (ikVariance >= 0 && keyCount > 3) {
    if (ikVariance < 5) {
      score -= 15;
      if (!reasons.includes("typing_pattern_nonhuman")) reasons.push("typing_pattern_nonhuman");
    } else if (ikVariance > 20) {
      score += 5;
    }
  }

  // Scroll behavior
  const scrollCount = Number(beh.scroll_event_count ?? 0);
  if (scrollCount === 0 && durationSec > 8) score -= 8;
  else if (scrollCount > 3) score += 5;

  const scrollVariance = beh.scroll_variance != null ? Number(beh.scroll_variance) : -1;
  if (scrollVariance >= 0 && scrollVariance < 1 && scrollCount > 2) {
    score -= 15;
    reasons.push("scroll_cadence_suspicious");
  }

  // Paste with no typing = bot filling forms
  const pasteCount = Number(beh.paste_count ?? 0);
  if (pasteCount > 0 && keyCount === 0) {
    score -= 15;
    reasons.push("paste_only_interaction");
  }

  // Focus/blur naturalness
  const focusBlurCount = beh.focus_blur_count != null ? Number(beh.focus_blur_count) : -1;
  if (focusBlurCount === 0 && durationSec > 10) score -= 5;

  // Idle periods (humans take breaks)
  const idlePeriods = Number(beh.idle_periods ?? 0);
  if (durationSec > 15 && idlePeriods === 0) score -= 5;
  else if (idlePeriods > 0) score += 3;

  // Zero interaction — only meaningful if the session ran long enough to expect signals
  const keyCount2 = Number(beh.key_event_count ?? 0);
  const scrollCount2 = Number(beh.scroll_event_count ?? 0);
  if (durationSec > 3 && mouseCount === 0 && clickCount === 0 && keyCount2 === 0 && scrollCount2 === 0) {
    score -= 12;
    reasons.push("zero_interaction_signals");
  }

  // Instant bot: very short KNOWN session, no interaction (guard durationSec > 0
  // so sessions that didn't send duration at all are not penalised)
  if (durationSec > 0 && durationSec < 1 && mouseCount === 0 && clickCount === 0) {
    score -= 20;
    reasons.push("instant_bounce_timing");
  }

  // Natural first interaction delay
  const firstInteraction = Number(beh.first_interaction_ms ?? 0);
  if (firstInteraction > 200 && firstInteraction < 8000) score += 5;

  return { score: clamp(score), reasons: [...new Set(reasons)] };
}

// ─── Group 3: Device Consistency (15%) ───────────────────────────────────────

function scoreDeviceConsistency(sig: Signals): { score: number; reasons: string[] } {
  let score = 80;
  const reasons: string[] = [];

  if (!sig.user_agent || sig.user_agent === "undefined" || sig.user_agent === "") {
    score -= 20;
    reasons.push("missing_user_agent");
  }

  if (!sig.timezone || sig.timezone === "") {
    score -= 10;
    reasons.push("inconsistent_timezone");
  }

  const hw = Number(sig.hardware_concurrency ?? 0);
  if (hw === 0) {
    score -= 10;
    reasons.push("hardware_profile_missing");
  } else {
    score += 5;
  }

  if (sig.device_memory != null) score += 3;

  const sw = Number(sig.screen_width ?? 0);
  const sh = Number(sig.screen_height ?? 0);
  if (sw === 0 || sh === 0) {
    score -= 10;
    reasons.push("screen_dimensions_missing");
  } else {
    // Headless engines often have exact-round dimensions (1920, 1080, etc.)
    const isExactRound = sw % 100 === 0 && sh % 100 === 0 && !sig.touch_support;
    if (isExactRound) score -= 5;
  }

  return { score: clamp(score), reasons };
}

// ─── Group 4: Network Reputation (20%) ───────────────────────────────────────

function scoreNetwork(ip: string, geo: GeoResult | null): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  const isPrivate = !ip
    || ip === "127.0.0.1"
    || ip === "::1"
    || ip === ""
    || ip.startsWith("10.")
    || ip.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);

  if (isPrivate) {
    // Dev/internal traffic — neutral, don't penalise
    return { score: 72, reasons };
  }

  let score = 85;
  if (!geo || !geo.country) {
    score -= 15;
    reasons.push("geo_unresolvable");
  }

  return { score: clamp(score), reasons };
}

// ─── Group 5: Historical Authenticity (15%) ──────────────────────────────────

async function scoreHistorical(
  workspaceId: string,
  fingerprintHash: string | null,
): Promise<{ score: number; reasons: string[]; count: number }> {
  const reasons: string[] = [];

  if (!fingerprintHash) {
    return { score: 65, reasons: ["no_fingerprint_history"], count: 0 };
  }

  try {
    const prior = await db
      .select({
        classification: sessionsTable.classification,
        humanClassification: sessionsTable.humanClassification,
      })
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.workspaceId, workspaceId),
          eq(sessionsTable.fingerprintHash, fingerprintHash),
        )
      )
      .orderBy(desc(sessionsTable.createdAt))
      .limit(20);

    if (prior.length === 0) return { score: 70, reasons: [], count: 0 };

    const trusted = prior.filter((s) =>
      s.classification === "trusted" || s.humanClassification === "human"
    ).length;
    const fraudulent = prior.filter((s) =>
      s.classification === "fraudulent" ||
      s.humanClassification === "bot" ||
      s.humanClassification === "automation"
    ).length;
    const suspicious = prior.filter((s) =>
      s.classification === "suspicious" || s.humanClassification === "suspicious_human"
    ).length;

    let score = 70;
    score += Math.min(25, trusted * 5);
    score -= Math.min(40, fraudulent * 15);
    score -= Math.min(15, suspicious * 5);

    if (trusted > 5) reasons.push("consistent_device_behavior");
    if (fraudulent > 0) reasons.push("prior_fraud_flags");

    return { score: clamp(score), reasons, count: prior.length };
  } catch {
    return { score: 65, reasons: [], count: 0 };
  }
}

// ─── Confidence estimation ────────────────────────────────────────────────────

function estimateConfidence(
  sig: Signals,
  beh: Behavior,
  historicalCount: number,
  groupScores: number[],
): number {
  let conf = 0.8;
  const durationSec = Number(beh.session_duration_ms ?? 0) / 1000;

  if (!sig.user_agent || sig.user_agent === "") conf -= 0.1;
  if (!sig.timezone) conf -= 0.05;
  if (Number(sig.hardware_concurrency ?? 0) === 0) conf -= 0.05;
  if (durationSec < 1) conf -= 0.15;
  else if (durationSec < 0.5) conf -= 0.1;

  const spread = Math.max(...groupScores) - Math.min(...groupScores);
  if (spread < 15) conf += 0.1;
  else if (spread > 40) conf -= 0.1;

  if (historicalCount >= 3) conf += 0.05;
  if (historicalCount >= 10) conf += 0.05;

  return Math.min(1, Math.max(0.1, conf));
}

// ─── Classification & decision ────────────────────────────────────────────────

function classify(score: number): HumanClassification {
  if (score >= 78) return "human";
  if (score >= 55) return "suspicious_human";
  if (score >= 35) return "automation";
  return "bot";
}

function decide(score: number, confidence: number): HumanDecision {
  if (score >= 78 && confidence >= 0.6) return "allow";
  if (score >= 55) return "step_up";
  if (score >= 35) return "challenge";
  return "block";
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scoreHumanAuthenticity(params: {
  signals: Signals;
  behavior: Behavior;
  ip: string;
  geo: GeoResult | null;
  workspaceId: string;
  fingerprintHash: string | null;
}): Promise<HumanScoreResult> {
  const { signals, behavior, ip, geo, workspaceId, fingerprintHash } = params;

  const { score: biScore, reasons: biReasons } = scoreBrowserIntegrity(signals);
  const { score: behScore, reasons: behReasons } = scoreBehavior(behavior);
  const { score: dcScore, reasons: dcReasons } = scoreDeviceConsistency(signals);
  const { score: netScore, reasons: netReasons } = scoreNetwork(ip, geo);
  const { score: histScore, reasons: histReasons, count: histCount } =
    await scoreHistorical(workspaceId, fingerprintHash);

  const groupScores = [biScore, behScore, dcScore, netScore, histScore];

  const humanScore = clamp(
    0.25 * biScore +
    0.25 * behScore +
    0.15 * dcScore +
    0.20 * netScore +
    0.15 * histScore,
  );

  const humanConfidence = estimateConfidence(signals, behavior, histCount, groupScores);

  // Behavior floor: no matter how high other sub-scores are,
  // a very low behavior score caps the classification.
  // behScore 26 with biScore 92 should NOT yield "suspicious_human".
  let humanClassification = classify(humanScore);
  let humanDecision = decide(humanScore, humanConfidence);

  if (behScore < 20) {
    humanClassification = "bot";
    humanDecision = "block";
  } else if (behScore < 40) {
    if (humanClassification === "human" || humanClassification === "suspicious_human") {
      humanClassification = "automation";
      humanDecision = "challenge";
    }
  } else if (behScore < 55) {
    if (humanClassification === "human") {
      humanClassification = "suspicious_human";
      humanDecision = "step_up";
    }
  }

  const allReasons = [...biReasons, ...behReasons, ...dcReasons, ...netReasons, ...histReasons];
  const uniqueReasons = [...new Set(allReasons)].slice(0, 5);

  return {
    humanScore,
    humanConfidence: Math.round(humanConfidence * 100) / 100,
    humanClassification,
    humanDecision,
    browserIntegrityScore: biScore,
    behaviorScore: behScore,
    deviceConsistencyScore: dcScore,
    networkScore: netScore,
    historicalScore: histScore,
    reasonCodes: uniqueReasons,
  };
}
