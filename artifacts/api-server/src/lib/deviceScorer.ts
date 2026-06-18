/**
 * Device Intelligence Engine
 *
 * Scores device trustworthiness by analysing cross-session patterns for a
 * given fingerprint: velocity, fraud-rate history, geographic spread, and
 * recurrence quality.
 *
 * Formula:
 *   deviceIntelScore (0–100, higher = safer) =
 *     0.30 * velocity
 *   + 0.30 * fraudRate
 *   + 0.20 * spread
 *   + 0.20 * recurrence
 */

import { db, sessionsTable } from "@workspace/db";
import { and, eq, gte, desc } from "drizzle-orm";

export type DeviceRiskTier = "clean" | "watch" | "suspicious" | "flagged" | "blocked";

export interface DeviceIntelResult {
  deviceIntelScore: number;
  deviceVelocityScore: number;
  deviceFraudRateScore: number;
  deviceSpreadScore: number;
  deviceRecurrenceScore: number;
  deviceRiskTier: DeviceRiskTier;
  sessionCount: number;
  reasonCodes: string[];
}

function clamp(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

// ── 1. Velocity (30%) ──────────────────────────────────────────────────────
// How many sessions has this device produced in the last 24 hours?
// A single human device rarely exceeds 5–10 page loads per day organically.

function scoreVelocity(sessionsLast24h: number): { score: number; codes: string[] } {
  const codes: string[] = [];
  let score: number;

  if (sessionsLast24h === 0) {
    score = 85;
  } else if (sessionsLast24h <= 5) {
    score = 90;
  } else if (sessionsLast24h <= 15) {
    score = 70;
  } else if (sessionsLast24h <= 30) {
    score = 45; codes.push("elevated_device_velocity");
  } else if (sessionsLast24h <= 60) {
    score = 20; codes.push("high_device_velocity");
  } else {
    score = 5; codes.push("device_velocity_attack");
  }

  return { score, codes };
}

// ── 2. Fraud Rate (30%) ────────────────────────────────────────────────────
// What percentage of this device's prior sessions were classified as bad?

function scoreFraudRate(
  total: number,
  fraudulent: number,
  suspicious: number,
): { score: number; codes: string[] } {
  if (total === 0) return { score: 75, codes: [] };

  const codes: string[] = [];
  const badRate = (fraudulent + suspicious * 0.5) / total;

  let score: number;
  if (badRate === 0) {
    score = 100;
  } else if (badRate < 0.05) {
    score = 85;
  } else if (badRate < 0.15) {
    score = 65;
  } else if (badRate < 0.30) {
    score = 40; codes.push("device_fraud_history");
  } else if (badRate < 0.60) {
    score = 15; codes.push("device_fraud_history");
  } else {
    score = 0; codes.push("device_fraud_history");
  }

  if (fraudulent >= 3) codes.push("repeat_fraud_device");

  return { score, codes };
}

// ── 3. Geographic Spread (20%) ─────────────────────────────────────────────
// How many distinct countries has this device appeared in?
// Humans travel occasionally; device farms and VPN rotators span many countries.

function scoreSpread(distinctCountries: number, distinctIps: number): { score: number; codes: string[] } {
  const codes: string[] = [];
  let score: number;

  if (distinctCountries <= 1) {
    score = 90;
  } else if (distinctCountries === 2) {
    score = 75;
  } else if (distinctCountries <= 4) {
    score = 50; codes.push("geographic_device_spread");
  } else if (distinctCountries <= 8) {
    score = 25; codes.push("geographic_device_spread");
  } else {
    score = 5; codes.push("device_farm_indicator");
  }

  if (distinctIps > 10 && distinctCountries <= 1) {
    score = Math.max(score - 10, 0);
    codes.push("ip_rotation_pattern");
  }

  return { score, codes };
}

// ── 4. Recurrence Pattern (20%) ────────────────────────────────────────────
// Is this device a healthy returning visitor or a suspicious recurrent actor?

function scoreRecurrence(
  total: number,
  trusted: number,
  daysSinceFirst: number,
): { score: number; codes: string[] } {
  const codes: string[] = [];

  if (total === 0) return { score: 70, codes: [] };

  const trustRate = trusted / total;
  let score = 65;

  if (total >= 10 && trustRate >= 0.9) {
    score = 95; codes.push("consistent_trusted_device");
  } else if (total >= 5 && trustRate >= 0.8) {
    score = 85;
  } else if (total >= 3 && trustRate >= 0.6) {
    score = 70;
  } else if (trustRate < 0.3 && total >= 3) {
    score = 20; codes.push("recurrent_suspicious_device");
  }

  if (daysSinceFirst > 30 && trustRate >= 0.7) score = Math.min(100, score + 5);

  return { score, codes };
}

// ── Risk tier & decision ──────────────────────────────────────────────────

function classifyDeviceRiskTier(score: number): DeviceRiskTier {
  if (score >= 80) return "clean";
  if (score >= 60) return "watch";
  if (score >= 40) return "suspicious";
  if (score >= 20) return "flagged";
  return "blocked";
}

// ── Main export ────────────────────────────────────────────────────────────

export async function scoreDeviceIntelligence(params: {
  fingerprintHash: string | null;
  workspaceId: string;
}): Promise<DeviceIntelResult> {
  const { fingerprintHash, workspaceId } = params;

  const NEUTRAL: DeviceIntelResult = {
    deviceIntelScore: 75,
    deviceVelocityScore: 85,
    deviceFraudRateScore: 75,
    deviceSpreadScore: 90,
    deviceRecurrenceScore: 70,
    deviceRiskTier: "clean",
    sessionCount: 0,
    reasonCodes: [],
  };

  if (!fingerprintHash) return NEUTRAL;

  try {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const sessions = await db
      .select({
        classification: sessionsTable.classification,
        country: sessionsTable.country,
        ip: sessionsTable.ip,
        startedAt: sessionsTable.startedAt,
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .where(and(
        eq(sessionsTable.workspaceId, workspaceId),
        eq(sessionsTable.fingerprintHash, fingerprintHash),
        gte(sessionsTable.createdAt, cutoff30d),
      ))
      .orderBy(desc(sessionsTable.createdAt))
      .limit(200);

    if (sessions.length === 0) return NEUTRAL;

    const sessionsLast24h = sessions.filter((s) => s.startedAt >= cutoff24h).length;
    const total = sessions.length;
    const trusted = sessions.filter((s) => s.classification === "trusted").length;
    const fraudulent = sessions.filter((s) => s.classification === "fraudulent").length;
    const suspicious = sessions.filter((s) => s.classification === "suspicious").length;

    const countries = new Set(sessions.map((s) => s.country).filter(Boolean));
    const ips = new Set(sessions.map((s) => s.ip).filter(Boolean));

    const earliest = sessions[sessions.length - 1];
    const firstSeenAt = earliest?.startedAt ?? earliest?.createdAt ?? new Date();
    const daysSinceFirst = (Date.now() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24);

    const { score: velScore, codes: velCodes } = scoreVelocity(sessionsLast24h);
    const { score: frScore, codes: frCodes } = scoreFraudRate(total, fraudulent, suspicious);
    const { score: spScore, codes: spCodes } = scoreSpread(countries.size, ips.size);
    const { score: recScore, codes: recCodes } = scoreRecurrence(total, trusted, daysSinceFirst);

    const deviceIntelScore = clamp(
      0.30 * velScore
      + 0.30 * frScore
      + 0.20 * spScore
      + 0.20 * recScore,
    );

    const allCodes = [...new Set([...velCodes, ...frCodes, ...spCodes, ...recCodes])];

    return {
      deviceIntelScore,
      deviceVelocityScore: velScore,
      deviceFraudRateScore: frScore,
      deviceSpreadScore: spScore,
      deviceRecurrenceScore: recScore,
      deviceRiskTier: classifyDeviceRiskTier(deviceIntelScore),
      sessionCount: total,
      reasonCodes: allCodes.slice(0, 4),
    };
  } catch {
    return NEUTRAL;
  }
}
