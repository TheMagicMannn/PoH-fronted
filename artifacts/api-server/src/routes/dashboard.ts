import { Router } from "express";
import { randomUUID, randomBytes } from "crypto";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import { db } from "@workspace/db";
import {
  usersTable, workspacesTable, sitesTable, sessionsTable, conversionsTable,
  rulesTable, investigationsTable, alertsTable, integrationsTable,
  auditLogsTable, fraudClustersTable, pageViewsTable,
} from "@workspace/db";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireRole, publicUser } from "../lib/auth.js";
import { hashPassword } from "../lib/auth.js";
import { scoreHumanAuthenticity } from "../lib/humanScorer.js";
import { scoreTrafficIntelligence } from "../lib/trafficScorer.js";

const router = Router();

const RANGE_DAYS: Record<string, number> = { "24h": 1, "7d": 7, "14d": 14, "30d": 30, "90d": 90 };

function cutoff(range: string): Date {
  const days = RANGE_DAYS[range] ?? 7;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function wsId(req: Express.Request): string {
  return (req as { user?: { workspaceId?: string | null } }).user?.workspaceId ?? "";
}

async function logAudit(workspaceId: string, userName: string, action: string, target: string, details: string) {
  await db.insert(auditLogsTable).values({
    id: randomUUID(), workspaceId, userName, action, target, details,
  });
}

const REASON_CODES: Record<string, { label: string; category: string }> = {
  browser_automation_detected: { label: "Browser automation indicators (WebDriver) present", category: "automation" },
  headless_browser_indicators: { label: "Headless browser signature detected", category: "automation" },
  missing_browser_plugins: { label: "No browser plugins on a desktop client", category: "fingerprint" },
  no_language_preferences: { label: "Browser reports no language preferences", category: "fingerprint" },
  low_human_interaction_depth: { label: "Low human interaction depth", category: "behavioral" },
  instant_bounce_timing: { label: "Session ended near-instantly", category: "behavioral" },
  tor_exit_node: { label: "Connection from Tor exit node", category: "network" },
  proxy_detected: { label: "Anonymizing proxy detected", category: "network" },
  vpn_usage: { label: "Commercial VPN in use", category: "network" },
  datacenter_ip_origin: { label: "Traffic from hosting/datacenter IP", category: "network" },
  repeated_fingerprint_short_window: { label: "Same device fingerprint repeated in short window", category: "recurrence" },
  recurring_fingerprint_pattern: { label: "Recurring device fingerprint across sessions", category: "recurrence" },
  abnormal_click_to_conversion_timing: { label: "Abnormally fast click-to-conversion timing", category: "behavioral" },
  anomalous_hardware_profile: { label: "Anomalous hardware concurrency profile", category: "fingerprint" },
  high_velocity_source: { label: "High request velocity from traffic source", category: "velocity" },
  // Traffic Intelligence Engine reason codes
  source_mismatch: { label: "Traffic source declaration inconsistent with observed behavior", category: "traffic" },
  campaign_spike: { label: "Unusual campaign traffic spike or missing attribution", category: "traffic" },
  low_engagement: { label: "Very low engagement signals — no scroll, click, or time on page", category: "traffic" },
  conversion_too_fast: { label: "Conversion timing too fast for genuine user interaction", category: "traffic" },
  datacenter_network: { label: "Traffic originating from datacenter, proxy, or VPN infrastructure", category: "traffic" },
  referral_loop: { label: "Referral source loop or inconsistency detected", category: "traffic" },
  repeat_fingerprint: { label: "Device fingerprint or automation markers indicate non-unique visitor", category: "traffic" },
  geo_inconsistency: { label: "IP geolocation unresolvable or inconsistent with declared source", category: "traffic" },
  burst_pattern: { label: "Traffic arriving in mechanical burst pattern inconsistent with human browsing", category: "traffic" },
  suspicious_attribution: { label: "Attribution chain shows paste-only, no-mouse, or scripted behavior", category: "traffic" },
  unknown_source: { label: "Traffic source is unknown, unrecognized, or absent", category: "traffic" },
  // Human Authenticity Engine reason codes
  webdriver_detected: { label: "WebDriver automation flag detected in browser", category: "automation" },
  headless_browser_detected: { label: "High-confidence headless browser environment", category: "automation" },
  automation_framework_signature: { label: "Automation framework globals detected (Puppeteer/Playwright/Selenium)", category: "automation" },
  window_metrics_anomaly: { label: "Window size metrics inconsistent with real browser", category: "automation" },
  cursor_entropy_low: { label: "Mouse path entropy too low — linear/scripted movement", category: "behavioral" },
  click_pattern_robotic: { label: "Click intervals show robotic regularity", category: "behavioral" },
  typing_pattern_nonhuman: { label: "Keystroke timing below human physiological minimum", category: "behavioral" },
  typing_pattern_suspicious: { label: "Typing cadence unusually fast or uniform", category: "behavioral" },
  scroll_cadence_suspicious: { label: "Scroll intervals show mechanical regularity", category: "behavioral" },
  paste_only_interaction: { label: "Form filled via paste with no keyboard interaction", category: "behavioral" },
  missing_user_agent: { label: "User-Agent string absent or empty", category: "fingerprint" },
  inconsistent_timezone: { label: "No timezone reported — possible automation environment", category: "fingerprint" },
  hardware_profile_missing: { label: "Hardware concurrency not reported", category: "fingerprint" },
  screen_dimensions_missing: { label: "Screen dimensions not reported", category: "fingerprint" },
  geo_unresolvable: { label: "IP geolocation unresolvable — possible masking", category: "network" },
  no_fingerprint_history: { label: "No prior session history for this device", category: "historical" },
  prior_fraud_flags: { label: "This device fingerprint has prior fraud flags", category: "historical" },
  consistent_device_behavior: { label: "Device shows consistent legitimate behavior history", category: "historical" },
  natural_session_rhythm: { label: "Session rhythm consistent with human browsing", category: "behavioral" },
};

// ---------- Overview ----------
router.get("/overview", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const range = (req.query["range"] as string) ?? "7d";
    const cut = cutoff(range);
    const siteFilter = req.query["site_id"] as string | undefined;

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(and(
        eq(sessionsTable.workspaceId, wid),
        gte(sessionsTable.startedAt, cut),
        siteFilter ? eq(sessionsTable.siteId, siteFilter) : undefined,
      ));

    const convs = await db
      .select()
      .from(conversionsTable)
      .where(and(
        eq(conversionsTable.workspaceId, wid),
        gte(conversionsTable.createdAt, cut),
        siteFilter ? eq(conversionsTable.siteId, siteFilter) : undefined,
      ));

    const total = sessions.length;
    const byCls: Record<string, number> = {};
    for (const s of sessions) byCls[s.classification] = (byCls[s.classification] ?? 0) + 1;
    const wasted = sessions
      .filter((s) => s.classification !== "trusted")
      .reduce((acc, s) => acc + (s.cost ?? 0), 0);
    const blocked = sessions.filter((s) => s.action === "block").length;

    const trendMap: Record<string, Record<string, number>> = {};
    for (const s of sessions) {
      const day = s.startedAt.toISOString().slice(0, 10);
      trendMap[day] ??= { trusted: 0, suspicious: 0, fraudulent: 0 };
      trendMap[day][s.classification] = (trendMap[day][s.classification] ?? 0) + 1;
    }
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const srcMap: Record<string, { total: number; bad: number; wasted: number }> = {};
    for (const s of sessions) {
      srcMap[s.source] ??= { total: 0, bad: 0, wasted: 0 };
      srcMap[s.source].total++;
      if (s.classification !== "trusted") {
        srcMap[s.source].bad++;
        srcMap[s.source].wasted += s.cost ?? 0;
      }
    }
    const bySource = Object.entries(srcMap)
      .sort(([, a], [, b]) => b.bad - a.bad)
      .map(([source, v]) => ({
        source,
        total: v.total,
        bad: v.bad,
        fraud_rate: v.total ? Math.round((v.bad / v.total) * 1000) / 10 : 0,
        wasted: Math.round(v.wasted * 100) / 100,
      }));

    const reasonCounts: Record<string, number> = {};
    for (const s of sessions) {
      for (const rc of (s.reasonCodes as string[] | null) ?? []) {
        reasonCounts[rc] = (reasonCounts[rc] ?? 0) + 1;
      }
    }
    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([code, count]) => ({ code, label: REASON_CODES[code]?.label ?? code, count }));

    const totalConv = convs.length;
    const invalidConv = convs.filter((c) => c.classification !== "trusted").length;
    const suppressed = convs.filter((c) => ["suppressed", "blocked"].includes(c.status)).length;

    // ---------- Extended analytics ----------

    // Geographic breakdown (top 15 by session count)
    type GeoEntry = { total: number; bad: number };
    const geoMap: Record<string, GeoEntry> = {};
    for (const s of sessions) {
      const key = s.country || "Unknown";
      geoMap[key] ??= { total: 0, bad: 0 };
      geoMap[key].total++;
      if (s.classification !== "trusted") geoMap[key].bad++;
    }
    const byCountry = Object.entries(geoMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 15)
      .map(([country, v]) => ({
        country,
        total: v.total,
        bad: v.bad,
        fraud_rate: v.total ? Math.round((v.bad / v.total) * 1000) / 10 : 0,
      }));

    // Device / Browser / OS breakdown
    function classBreakdown(key: keyof typeof sessions[0]) {
      type Entry = { total: number; bad: number };
      const map: Record<string, Entry> = {};
      for (const s of sessions) {
        const k = (s[key] as string | null | undefined) || "Unknown";
        map[k] ??= { total: 0, bad: 0 };
        map[k].total++;
        if (s.classification !== "trusted") map[k].bad++;
      }
      return Object.entries(map)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 8)
        .map(([name, v]) => ({
          name,
          total: v.total,
          bad: v.bad,
          fraud_rate: v.total ? Math.round((v.bad / v.total) * 1000) / 10 : 0,
        }));
    }
    const byDevice = classBreakdown("deviceType");
    const byBrowser = classBreakdown("browser");
    const byOs = classBreakdown("os");

    // Hourly attack pattern (24 buckets, UTC hour)
    type HourEntry = { trusted: number; suspicious: number; fraudulent: number };
    const hourMap: Record<number, HourEntry> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = { trusted: 0, suspicious: 0, fraudulent: 0 };
    for (const s of sessions) {
      const h = s.startedAt.getUTCHours();
      const cls = s.classification as keyof HourEntry;
      if (hourMap[h] && cls in hourMap[h]) hourMap[h][cls]++;
    }
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      ...hourMap[h]!,
      total: (hourMap[h]?.trusted ?? 0) + (hourMap[h]?.suspicious ?? 0) + (hourMap[h]?.fraudulent ?? 0),
    }));

    // Score distribution (5 buckets: 0-20, 20-40, 40-60, 60-80, 80-100)
    const buckets = [
      { range: "0–20", min: 0, max: 20 },
      { range: "20–40", min: 20, max: 40 },
      { range: "40–60", min: 40, max: 60 },
      { range: "60–80", min: 60, max: 80 },
      { range: "80–100", min: 80, max: 100 },
    ];
    const scoreDist = buckets.map(({ range: r, min, max }) => {
      const items = sessions.filter((s) => s.fraudScore >= min && (max === 100 ? s.fraudScore <= max : s.fraudScore < max));
      return { range: r, count: items.length, min, max };
    });

    // Avg trust score & confidence
    const avgTrustScore = total > 0 ? Math.round(sessions.reduce((acc, s) => acc + (s.trustScore ?? 0), 0) / total) : 0;
    const avgConfidence = total > 0 ? Math.round((sessions.reduce((acc, s) => acc + (s.confidence ?? 0), 0) / total) * 100) : 0;

    // Human Authenticity Intel aggregations
    const humanClsMap: Record<string, number> = {};
    for (const s of sessions) {
      const hcls = s.humanClassification ?? "unscored";
      humanClsMap[hcls] = (humanClsMap[hcls] ?? 0) + 1;
    }
    const humanClassificationBreakdown = [
      { name: "human", label: "Human", value: humanClsMap["human"] ?? 0 },
      { name: "suspicious_human", label: "Suspicious", value: humanClsMap["suspicious_human"] ?? 0 },
      { name: "automation", label: "Automation", value: humanClsMap["automation"] ?? 0 },
      { name: "bot", label: "Bot", value: humanClsMap["bot"] ?? 0 },
    ];

    const scoredSessions = sessions.filter((s) => s.humanScore != null);
    const avgHumanScore = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((acc, s) => acc + (s.humanScore ?? 0), 0) / scoredSessions.length)
      : null;
    const avgHumanScores = scoredSessions.length > 0 ? {
      human: avgHumanScore,
      browser_integrity: Math.round(scoredSessions.reduce((acc, s) => acc + (s.browserIntegrityScore ?? 0), 0) / scoredSessions.length),
      behavior: Math.round(scoredSessions.reduce((acc, s) => acc + (s.behaviorScore ?? 0), 0) / scoredSessions.length),
      device_consistency: Math.round(scoredSessions.reduce((acc, s) => acc + (s.deviceConsistencyScore ?? 0), 0) / scoredSessions.length),
      network: Math.round(scoredSessions.reduce((acc, s) => acc + (s.networkScore ?? 0), 0) / scoredSessions.length),
      historical: Math.round(scoredSessions.reduce((acc, s) => acc + (s.historicalScore ?? 0), 0) / scoredSessions.length),
    } : null;

    // Traffic Intelligence Engine aggregations
    const trafficTierMap: Record<string, number> = {};
    for (const s of sessions) {
      const tier = s.trafficRiskTier ?? "unscored";
      trafficTierMap[tier] = (trafficTierMap[tier] ?? 0) + 1;
    }
    const trafficRiskTierBreakdown = [
      { name: "low",      label: "Low Risk",  value: trafficTierMap["low"]      ?? 0 },
      { name: "medium",   label: "Medium",    value: trafficTierMap["medium"]   ?? 0 },
      { name: "elevated", label: "Elevated",  value: trafficTierMap["elevated"] ?? 0 },
      { name: "high",     label: "High Risk", value: trafficTierMap["high"]     ?? 0 },
      { name: "critical", label: "Critical",  value: trafficTierMap["critical"] ?? 0 },
    ];
    const trafficScoredSessions = sessions.filter((s) => s.trafficTrustScore != null);
    const avgTrafficTrustScore = trafficScoredSessions.length > 0
      ? Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficTrustScore ?? 0), 0) / trafficScoredSessions.length)
      : null;
    const avgTrafficScores = trafficScoredSessions.length > 0 ? {
      traffic_trust: avgTrafficTrustScore,
      source:        Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficSourceScore ?? 0), 0)        / trafficScoredSessions.length),
      campaign:      Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficCampaignScore ?? 0), 0)      / trafficScoredSessions.length),
      engagement:    Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficEngagementScore ?? 0), 0)    / trafficScoredSessions.length),
      conversion:    Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficConversionScore ?? 0), 0)    / trafficScoredSessions.length),
      referral:      Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficReferralScore ?? 0), 0)      / trafficScoredSessions.length),
      geo:           Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficGeoScore ?? 0), 0)           / trafficScoredSessions.length),
      temporal:      Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficTemporalScore ?? 0), 0)      / trafficScoredSessions.length),
      device_network: Math.round(trafficScoredSessions.reduce((acc, s) => acc + (s.trafficDeviceNetworkScore ?? 0), 0) / trafficScoredSessions.length),
    } : null;

    res.json({
      range,
      kpis: {
        total_sessions: total,
        trusted: byCls["trusted"] ?? 0,
        suspicious: byCls["suspicious"] ?? 0,
        fraudulent: byCls["fraudulent"] ?? 0,
        invalid_traffic_rate: total ? Math.round(((total - (byCls["trusted"] ?? 0)) / total) * 1000) / 10 : 0,
        estimated_wasted_spend: Math.round(wasted * 100) / 100,
        blocked_sessions: blocked,
        total_conversions: totalConv,
        invalid_conversions: invalidConv,
        invalid_conversion_rate: totalConv ? Math.round((invalidConv / totalConv) * 1000) / 10 : 0,
        suppressed_conversions: suppressed,
        avg_trust_score: avgTrustScore,
        avg_confidence: avgConfidence,
        avg_human_score: avgHumanScore,
        avg_traffic_trust_score: avgTrafficTrustScore,
      },
      distribution: [
        { name: "trusted", value: byCls["trusted"] ?? 0 },
        { name: "suspicious", value: byCls["suspicious"] ?? 0 },
        { name: "fraudulent", value: byCls["fraudulent"] ?? 0 },
      ],
      trend,
      by_source: bySource,
      top_reasons: topReasons,
      by_country: byCountry,
      by_device: byDevice,
      by_browser: byBrowser,
      by_os: byOs,
      hourly,
      score_distribution: scoreDist,
      human_classification_breakdown: humanClassificationBreakdown,
      avg_human_scores: avgHumanScores,
      traffic_risk_tier_breakdown: trafficRiskTierBreakdown,
      avg_traffic_scores: avgTrafficScores,
    });
  } catch (err) {
    res.status(500).json({ detail: "Failed to load overview" });
  }
});

// ---------- Sessions ----------
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const range = (req.query["range"] as string) ?? "30d";
    const page = Math.max(1, Number(req.query["page"]) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query["page_size"]) || 25));
    const siteFilter = req.query["site_id"] as string | undefined;

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(and(
        eq(sessionsTable.workspaceId, wid),
        gte(sessionsTable.startedAt, cutoff(range)),
        siteFilter ? eq(sessionsTable.siteId, siteFilter) : undefined,
      ))
      .orderBy(desc(sessionsTable.startedAt));

    let items = sessions;
    if (req.query["classification"]) items = items.filter((s) => s.classification === req.query["classification"]);
    if (req.query["source"]) items = items.filter((s) => s.source === req.query["source"]);
    if (req.query["device"]) items = items.filter((s) => s.deviceType === req.query["device"]);
    if (req.query["country"]) items = items.filter((s) => s.country === req.query["country"]);
    if (req.query["action"]) items = items.filter((s) => s.action === req.query["action"]);

    const total = items.length;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);
    res.json({ total, page, page_size: pageSize, items: paginated });
  } catch {
    res.status(500).json({ detail: "Failed to load sessions" });
  }
});

router.get("/sessions/:sid", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.workspaceId, wid), eq(sessionsTable.id, String(req.params["sid"]))))
      .limit(1);
    if (!session) { res.status(404).json({ detail: "Session not found" }); return; }

    const convs = await db
      .select()
      .from(conversionsTable)
      .where(and(eq(conversionsTable.workspaceId, wid), eq(conversionsTable.sessionId, session.sessionId)));

    res.json({ ...session, conversions: convs });
  } catch {
    res.status(500).json({ detail: "Failed to load session" });
  }
});

router.post("/sessions/:sid/action", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.workspaceId, wid), eq(sessionsTable.id, String(req.params["sid"]))))
      .limit(1);
    if (!session) { res.status(404).json({ detail: "Session not found" }); return; }

    const mapping: Record<string, string> = { block: "block", review: "review", trust: "observe", observe: "observe" };
    const action = mapping[req.body.action] ?? req.body.action;

    await db
      .update(sessionsTable)
      .set({ action, manualOverride: true, updatedAt: new Date() })
      .where(and(eq(sessionsTable.workspaceId, wid), eq(sessionsTable.id, String(req.params["sid"]))));

    await logAudit(wid, req.user!.name, "session.action", session.sessionId,
      `Manually set action to '${action}'${req.body.note ? `: ${req.body.note}` : ""}`);
    res.json({ ok: true, action });
  } catch {
    res.status(500).json({ detail: "Failed to update session" });
  }
});

// ---------- Conversions ----------
router.get("/conversions", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const range = (req.query["range"] as string) ?? "30d";
    const page = Math.max(1, Number(req.query["page"]) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query["page_size"]) || 25));
    const siteFilter = req.query["site_id"] as string | undefined;

    const convs = await db
      .select()
      .from(conversionsTable)
      .where(and(
        eq(conversionsTable.workspaceId, wid),
        gte(conversionsTable.createdAt, cutoff(range)),
        siteFilter ? eq(conversionsTable.siteId, siteFilter) : undefined,
      ))
      .orderBy(desc(conversionsTable.createdAt));

    let items = convs;
    if (req.query["status"]) items = items.filter((c) => c.status === req.query["status"]);
    if (req.query["classification"]) items = items.filter((c) => c.classification === req.query["classification"]);
    if (req.query["type"]) items = items.filter((c) => c.type === req.query["type"]);
    if (req.query["source"]) items = items.filter((c) => c.source === req.query["source"]);

    const total = items.length;
    res.json({ total, page, page_size: pageSize, items: items.slice((page - 1) * pageSize, page * pageSize) });
  } catch {
    res.status(500).json({ detail: "Failed to load conversions" });
  }
});

router.post("/conversions/:cid/action", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const [conv] = await db
      .select()
      .from(conversionsTable)
      .where(and(eq(conversionsTable.workspaceId, wid), eq(conversionsTable.id, String(req.params["cid"]))))
      .limit(1);
    if (!conv) { res.status(404).json({ detail: "Conversion not found" }); return; }

    await db
      .update(conversionsTable)
      .set({ status: req.body.status, manualOverride: true, updatedAt: new Date() })
      .where(and(eq(conversionsTable.workspaceId, wid), eq(conversionsTable.id, String(req.params["cid"]))));

    await logAudit(wid, req.user!.name, "conversion.action", `Conversion #${conv.id.slice(0, 6)}`,
      `Set status to '${req.body.status}'${req.body.note ? `: ${req.body.note}` : ""}`);
    res.json({ ok: true, status: req.body.status });
  } catch {
    res.status(500).json({ detail: "Failed to update conversion" });
  }
});

// ---------- Campaigns ----------
router.get("/campaigns", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const range = (req.query["range"] as string) ?? "30d";
    const siteFilter = req.query["site_id"] as string | undefined;
    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(and(
        eq(sessionsTable.workspaceId, wid),
        gte(sessionsTable.startedAt, cutoff(range)),
        siteFilter ? eq(sessionsTable.siteId, siteFilter) : undefined,
      ));

    const agg: Record<string, { total: number; trusted: number; suspicious: number; fraudulent: number; spend: number; wasted: number }> = {};
    for (const s of sessions) {
      const key = `${s.source}||${s.medium ?? ""}||${s.campaign ?? ""}||${s.adSet ?? ""}`;
      agg[key] ??= { total: 0, trusted: 0, suspicious: 0, fraudulent: 0, spend: 0, wasted: 0 };
      const a = agg[key]!;
      a.total++;
      (a as Record<string, number>)[s.classification] = ((a as Record<string, number>)[s.classification] ?? 0) + 1;
      a.spend += s.cost ?? 0;
      if (s.classification !== "trusted") a.wasted += s.cost ?? 0;
    }

    const campaigns = Object.entries(agg).map(([key, a]) => {
      const [source, medium, campaign, adSet] = key.split("||");
      return {
        source, medium, campaign, ad_set: adSet,
        total: a.total, trusted: a.trusted, suspicious: a.suspicious, fraudulent: a.fraudulent,
        fraud_rate: a.total ? Math.round(((a.total - a.trusted) / a.total) * 1000) / 10 : 0,
        spend: Math.round(a.spend * 100) / 100,
        wasted: Math.round(a.wasted * 100) / 100,
      };
    }).sort((a, b) => b.wasted - a.wasted);

    res.json({ campaigns });
  } catch {
    res.status(500).json({ detail: "Failed to load campaigns" });
  }
});

// ---------- Rules ----------
router.get("/rules", requireAuth, async (req, res) => {
  try {
    const rules = await db
      .select()
      .from(rulesTable)
      .where(eq(rulesTable.workspaceId, wsId(req)))
      .orderBy(desc(rulesTable.priority));
    res.json({ rules });
  } catch {
    res.status(500).json({ detail: "Failed to load rules" });
  }
});

router.post("/rules", requireRole("analyst"), async (req, res) => {
  try {
    const wid = wsId(req);
    const rule = {
      id: randomUUID(), workspaceId: wid, name: req.body.name,
      description: req.body.description, enabled: req.body.enabled ?? true,
      conditions: req.body.conditions ?? [], action: req.body.action ?? "observe",
      priority: req.body.priority ?? 0, hits: 0, createdBy: req.user!.name,
    };
    await db.insert(rulesTable).values(rule);
    await logAudit(wid, req.user!.name, "rule.create", rule.name, "Created rule");
    res.status(201).json(rule);
  } catch {
    res.status(500).json({ detail: "Failed to create rule" });
  }
});

router.patch("/rules/:rid", requireRole("analyst"), async (req, res) => {
  try {
    const wid = wsId(req);
    const [existing] = await db
      .select()
      .from(rulesTable)
      .where(and(eq(rulesTable.workspaceId, wid), eq(rulesTable.id, String(req.params["rid"]))))
      .limit(1);
    if (!existing) { res.status(404).json({ detail: "Rule not found" }); return; }

    const updates: Partial<typeof rulesTable.$inferInsert> = {};
    const allowed = ["name", "description", "enabled", "conditions", "action", "priority"] as const;
    for (const k of allowed) {
      if (req.body[k] !== undefined) (updates as Record<string, unknown>)[k] = req.body[k];
    }

    await db
      .update(rulesTable)
      .set(updates)
      .where(and(eq(rulesTable.workspaceId, wid), eq(rulesTable.id, String(req.params["rid"]))));

    await logAudit(wid, req.user!.name, "rule.update", existing.name ?? "", "Updated rule");
    const [updated] = await db
      .select().from(rulesTable)
      .where(and(eq(rulesTable.workspaceId, wid), eq(rulesTable.id, String(req.params["rid"]))))
      .limit(1);
    res.json(updated);
  } catch {
    res.status(500).json({ detail: "Failed to update rule" });
  }
});

router.delete("/rules/:rid", requireRole("analyst"), async (req, res) => {
  try {
    const wid = wsId(req);
    const [rule] = await db
      .select()
      .from(rulesTable)
      .where(and(eq(rulesTable.workspaceId, wid), eq(rulesTable.id, String(req.params["rid"]))))
      .limit(1);
    if (!rule) { res.status(404).json({ detail: "Rule not found" }); return; }

    await db.delete(rulesTable).where(and(eq(rulesTable.workspaceId, wid), eq(rulesTable.id, String(req.params["rid"]))));
    await logAudit(wid, req.user!.name, "rule.delete", rule.name ?? "", "Deleted rule");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to delete rule" });
  }
});

// ---------- Investigations ----------
router.get("/investigations", requireAuth, async (req, res) => {
  try {
    const invs = await db
      .select()
      .from(investigationsTable)
      .where(eq(investigationsTable.workspaceId, wsId(req)))
      .orderBy(desc(investigationsTable.createdAt));
    res.json({ investigations: invs });
  } catch {
    res.status(500).json({ detail: "Failed to load investigations" });
  }
});

router.post("/investigations", requireRole("analyst"), async (req, res) => {
  try {
    const wid = wsId(req);
    const inv = {
      id: randomUUID(), workspaceId: wid, title: req.body.title,
      severity: req.body.severity ?? "medium", status: "open",
      assignee: req.user!.name, clusterId: req.body.cluster_id ?? null,
      notes: [{ author: req.user!.name, text: req.body.notes || "Investigation opened.", at: new Date().toISOString() }],
    };
    await db.insert(investigationsTable).values(inv);
    await logAudit(wid, req.user!.name, "investigation.create", inv.title, "Opened investigation");
    res.status(201).json(inv);
  } catch {
    res.status(500).json({ detail: "Failed to create investigation" });
  }
});

router.patch("/investigations/:iid", requireRole("analyst"), async (req, res) => {
  try {
    const wid = wsId(req);
    const [inv] = await db
      .select()
      .from(investigationsTable)
      .where(and(eq(investigationsTable.workspaceId, wid), eq(investigationsTable.id, String(req.params["iid"]))))
      .limit(1);
    if (!inv) { res.status(404).json({ detail: "Investigation not found" }); return; }

    const updates: Partial<typeof investigationsTable.$inferInsert> = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.severity) updates.severity = req.body.severity;

    const currentNotes = (inv.notes as Array<{ author: string; text: string; at: string }>) ?? [];
    if (req.body.note) {
      updates.notes = [...currentNotes, { author: req.user!.name, text: req.body.note, at: new Date().toISOString() }];
    }

    if (Object.keys(updates).length) {
      await db
        .update(investigationsTable)
        .set(updates)
        .where(and(eq(investigationsTable.workspaceId, wid), eq(investigationsTable.id, String(req.params["iid"]))));
    }

    const [updated] = await db
      .select().from(investigationsTable)
      .where(and(eq(investigationsTable.workspaceId, wid), eq(investigationsTable.id, String(req.params["iid"]))))
      .limit(1);
    res.json(updated);
  } catch {
    res.status(500).json({ detail: "Failed to update investigation" });
  }
});

router.get("/clusters", requireAuth, async (req, res) => {
  try {
    const clusters = await db
      .select()
      .from(fraudClustersTable)
      .where(eq(fraudClustersTable.workspaceId, wsId(req)))
      .orderBy(desc(fraudClustersTable.sessionCount));
    res.json({ clusters });
  } catch {
    res.status(500).json({ detail: "Failed to load clusters" });
  }
});

// ---------- Integrations ----------
const PROVIDER_NAMES: Record<string, string> = {
  ga4: "Google Analytics 4", google_ads: "Google Ads", meta_ads: "Meta Ads",
  webhook: "Outbound Webhook", hubspot: "HubSpot CRM",
};
const PROVIDER_METRICS: Record<string, string> = {
  ga4: "Syncing conversion events", google_ads: "Campaigns linked",
  meta_ads: "Ad sets linked", webhook: "Endpoint active", hubspot: "Syncing lead quality scores",
};

router.get("/integrations", requireAuth, async (req, res) => {
  try {
    const items = await db
      .select()
      .from(integrationsTable)
      .where(eq(integrationsTable.workspaceId, wsId(req)));
    res.json({ integrations: items });
  } catch {
    res.status(500).json({ detail: "Failed to load integrations" });
  }
});

router.post("/integrations/:provider/connect", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const provider = String(req.params["provider"]);
    const now = new Date();
    const [existing] = await db
      .select()
      .from(integrationsTable)
      .where(and(eq(integrationsTable.workspaceId, wid), eq(integrationsTable.provider, provider!)))
      .limit(1);

    const payload = {
      status: "connected", connectedAt: now, lastSync: now,
      metric: PROVIDER_METRICS[provider!] ?? "Connected", config: { demo: true },
    };

    if (existing) {
      await db.update(integrationsTable).set(payload)
        .where(and(eq(integrationsTable.workspaceId, wid), eq(integrationsTable.provider, provider!)));
    } else {
      await db.insert(integrationsTable).values({
        id: randomUUID(), workspaceId: wid, provider: provider!,
        name: PROVIDER_NAMES[provider!] ?? provider!, ...payload,
      });
    }

    await logAudit(wid, req.user!.name, "integration.connect", PROVIDER_NAMES[provider!] ?? provider!, "Connected integration");
    const [updated] = await db
      .select().from(integrationsTable)
      .where(and(eq(integrationsTable.workspaceId, wid), eq(integrationsTable.provider, provider!)))
      .limit(1);
    res.json(updated);
  } catch {
    res.status(500).json({ detail: "Failed to connect integration" });
  }
});

router.post("/integrations/:provider/disconnect", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const provider = String(req.params["provider"]);
    await db.update(integrationsTable)
      .set({ status: "disconnected", connectedAt: null, lastSync: null })
      .where(and(eq(integrationsTable.workspaceId, wid), eq(integrationsTable.provider, provider!)));
    await logAudit(wid, req.user!.name, "integration.disconnect", PROVIDER_NAMES[provider!] ?? provider!, "Disconnected integration");
    const [updated] = await db
      .select().from(integrationsTable)
      .where(and(eq(integrationsTable.workspaceId, wid), eq(integrationsTable.provider, provider!)))
      .limit(1);
    res.json(updated);
  } catch {
    res.status(500).json({ detail: "Failed to disconnect integration" });
  }
});

// ---------- Alerts ----------
router.get("/alerts", requireAuth, async (req, res) => {
  try {
    const items = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.workspaceId, wsId(req)))
      .orderBy(desc(alertsTable.createdAt))
      .limit(100);
    const unread = items.filter((a) => !a.read).length;
    res.json({ alerts: items, unread });
  } catch {
    res.status(500).json({ detail: "Failed to load alerts" });
  }
});

router.post("/alerts/:aid/read", requireAuth, async (req, res) => {
  try {
    await db.update(alertsTable)
      .set({ read: true })
      .where(and(eq(alertsTable.workspaceId, wsId(req)), eq(alertsTable.id, String(req.params["aid"]))));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to mark alert read" });
  }
});

// ---------- Audit logs ----------
router.get("/audit-logs", requireAuth, async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.workspaceId, wsId(req)))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(200);
    res.json({ logs });
  } catch {
    res.status(500).json({ detail: "Failed to load audit logs" });
  }
});

// ---------- Workspace ----------
router.get("/workspace", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const [ws] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, wid)).limit(1);
    const sites = await db.select().from(sitesTable).where(eq(sitesTable.workspaceId, wid));
    res.json({ workspace: ws ?? null, sites });
  } catch {
    res.status(500).json({ detail: "Failed to load workspace" });
  }
});

router.patch("/workspace", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const allowed = ["name", "sensitivityProfile", "plan"] as const;
    const updates: Partial<typeof workspacesTable.$inferInsert> = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) (updates as Record<string, unknown>)[k] = req.body[k];
    }
    if (req.body["sensitivity_profile"]) updates.sensitivityProfile = req.body["sensitivity_profile"];
    if (Object.keys(updates).length) {
      await db.update(workspacesTable).set(updates).where(eq(workspacesTable.id, wid));
      if (updates.sensitivityProfile) {
        await logAudit(wid, req.user!.name, "sensitivity.update", "Workspace", `Changed sensitivity to ${updates.sensitivityProfile}`);
      }
    }
    const [ws] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, wid)).limit(1);
    res.json(ws ?? null);
  } catch {
    res.status(500).json({ detail: "Failed to update workspace" });
  }
});

router.get("/workspace/members", requireAuth, async (req, res) => {
  try {
    const members = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, workspaceId: usersTable.workspaceId, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.workspaceId, wsId(req)));
    res.json({ members });
  } catch {
    res.status(500).json({ detail: "Failed to load members" });
  }
});

router.post("/workspace/members", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const email = (req.body.email as string).toLowerCase().trim();
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) { res.status(400).json({ detail: "A user with this email already exists" }); return; }

    const newUser = {
      id: randomUUID(), name: req.body.name, email,
      passwordHash: hashPassword(req.body.password ?? randomUUID()),
      role: req.body.role ?? "analyst", workspaceId: wid,
    };
    await db.insert(usersTable).values(newUser);
    await logAudit(wid, req.user!.name, "member.invite", email, `Invited as ${newUser.role}`);
    res.status(201).json(publicUser({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, workspaceId: wid }));
  } catch {
    res.status(500).json({ detail: "Failed to invite member" });
  }
});

router.delete("/workspace/members/:mid", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    if (req.params["mid"] === req.user!.id) { res.status(400).json({ detail: "You cannot remove yourself" }); return; }
    const [m] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.workspaceId, wid), eq(usersTable.id, String(req.params["mid"]))))
      .limit(1);
    if (!m) { res.status(404).json({ detail: "Member not found" }); return; }
    await db.delete(usersTable).where(and(eq(usersTable.workspaceId, wid), eq(usersTable.id, String(req.params["mid"]))));
    await logAudit(wid, req.user!.name, "member.remove", m.email, "Removed member");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to remove member" });
  }
});

// ---------- Sites ----------
function getPublicApiBase(req: import("express").Request): string {
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) {
    const primary = domains.split(",")[0]!.trim();
    return `https://${primary}`;
  }
  const host = req.get("host") ?? "localhost:8080";
  const proto = req.protocol ?? "http";
  return `${proto}://${host}`;
}

router.get("/sites", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const sites = await db.select().from(sitesTable).where(eq(sitesTable.workspaceId, wid));
    const base = getPublicApiBase(req);

    // Attach per-site session/conversion counts
    const allSessions = await db
      .select({ siteId: sessionsTable.siteId })
      .from(sessionsTable)
      .where(eq(sessionsTable.workspaceId, wid));
    const sessionCounts: Record<string, number> = {};
    for (const s of allSessions) if (s.siteId) sessionCounts[s.siteId] = (sessionCounts[s.siteId] ?? 0) + 1;

    res.json({
      sites: sites.map((s) => ({
        ...s,
        sessions_total: sessionCounts[s.id] ?? 0,
        snippet: `<script async src="${base}/api/poh.js" data-poh-key="${s.sdkKey}"></script>`,
      })),
    });
  } catch {
    res.status(500).json({ detail: "Failed to load sites" });
  }
});

router.post("/sites", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const { name, domain } = req.body as { name?: string; domain?: string };
    if (!name || !domain) { res.status(400).json({ detail: "name and domain are required" }); return; }
    const sdkKey = "poh_" + randomBytes(16).toString("hex");
    const verificationToken = "poh-verify=" + randomBytes(12).toString("hex");
    const id = randomUUID();
    await db.insert(sitesTable).values({ id, workspaceId: wid, name, domain: domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""), sdkKey, verified: false, verificationToken });
    await logAudit(wid, req.user!.name, "site.created", id, `Created site "${name}" for ${domain}`);
    res.status(201).json({ id, name, domain, sdk_key: sdkKey, verified: false, verification_token: verificationToken });
  } catch (err) {
    res.status(500).json({ detail: "Failed to create site", error: String(err) });
  }
});

router.patch("/sites/:sid", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const sid = String(req.params["sid"]);
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, sid), eq(sitesTable.workspaceId, wid))).limit(1);
    if (!site) { res.status(404).json({ detail: "Site not found" }); return; }
    const updates: Partial<typeof site> = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.domain) updates.domain = (req.body.domain as string).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    await db.update(sitesTable).set(updates).where(eq(sitesTable.id, sid));
    await logAudit(wid, req.user!.name, "site.updated", sid, `Updated site "${site.name}"`);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to update site" });
  }
});

router.delete("/sites/:sid", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const sid = String(req.params["sid"]);
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, sid), eq(sitesTable.workspaceId, wid))).limit(1);
    if (!site) { res.status(404).json({ detail: "Site not found" }); return; }
    await db.delete(sitesTable).where(eq(sitesTable.id, sid));
    await logAudit(wid, req.user!.name, "site.deleted", sid, `Deleted site "${site.name}" (${site.domain})`);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to delete site" });
  }
});

router.post("/sites/:sid/rotate-key", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const sid = String(req.params["sid"]);
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, sid), eq(sitesTable.workspaceId, wid))).limit(1);
    if (!site) { res.status(404).json({ detail: "Site not found" }); return; }
    const newKey = "poh_" + randomBytes(16).toString("hex");
    await db.update(sitesTable).set({ sdkKey: newKey }).where(eq(sitesTable.id, sid));
    await logAudit(wid, req.user!.name, "site.key_rotated", sid, `Rotated SDK key for "${site.name}"`);
    res.json({ ok: true, sdk_key: newKey });
  } catch {
    res.status(500).json({ detail: "Failed to rotate key" });
  }
});

router.post("/sites/:sid/verify", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const sid = String(req.params["sid"]);
    const [site] = await db.select().from(sitesTable).where(and(eq(sitesTable.id, sid), eq(sitesTable.workspaceId, wid))).limit(1);
    if (!site) { res.status(404).json({ detail: "Site not found" }); return; }
    if (site.verified) { res.json({ ok: true, verified: true }); return; }

    let token = site.verificationToken;
    if (!token) {
      token = "poh-verify=" + randomBytes(12).toString("hex");
      await db.update(sitesTable).set({ verificationToken: token }).where(eq(sitesTable.id, sid));
    }

    // In production this would do a real DNS TXT lookup. Here we simulate success via a flag in the request.
    const forceVerify = req.body?.confirm === true;
    if (forceVerify) {
      await db.update(sitesTable).set({ verified: true }).where(eq(sitesTable.id, sid));
      await logAudit(wid, req.user!.name, "site.verified", sid, `Verified domain "${site.domain}"`);
      res.json({ ok: true, verified: true });
    } else {
      res.json({ ok: true, verified: false, dns_record: { type: "TXT", name: `_poh-verify.${site.domain}`, value: token } });
    }
  } catch {
    res.status(500).json({ detail: "Failed to verify site" });
  }
});

// ---------- Demo seed ----------
router.post("/demo/seed", requireRole("admin"), async (req, res) => {
  try {
    const wid = wsId(req);
    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.workspaceId, wid)).limit(1);
    if (!site) { res.status(400).json({ detail: "No site found for workspace" }); return; }

    const now = new Date();
    const sources = [
      { source: "google", medium: "cpc", campaign: "Brand - Search", adSet: "Exact Match", fraudBias: 0.06 },
      { source: "google", medium: "cpc", campaign: "Competitor - Search", adSet: "Phrase Match", fraudBias: 0.22 },
      { source: "meta", medium: "paid_social", campaign: "Prospecting - Lookalike 1%", adSet: "Creative A", fraudBias: 0.27 },
      { source: "meta", medium: "paid_social", campaign: "Retargeting - 30d", adSet: "Carousel", fraudBias: 0.31 },
      { source: "google", medium: "organic", campaign: "(organic)", adSet: "", fraudBias: 0.04 },
      { source: "direct", medium: "none", campaign: "(direct)", adSet: "", fraudBias: 0.05 },
    ];
    const countries = ["United States", "United Kingdom", "Germany", "India", "Singapore", "Canada"];
    const devices = ["Desktop", "Mobile", "Tablet"];
    const browsers = ["Chrome", "Safari", "Edge", "Firefox"];
    const classifications = ["trusted", "suspicious", "fraudulent"] as const;

    const sessionInserts = [];
    const conversionInserts = [];

    for (let i = 0; i < 200; i++) {
      const src = sources[Math.floor(Math.random() * sources.length)]!;
      const isFraud = Math.random() < src.fraudBias * 3;
      const isSuspicious = !isFraud && Math.random() < src.fraudBias * 1.5;
      const cls: "trusted" | "suspicious" | "fraudulent" = isFraud ? "fraudulent" : isSuspicious ? "suspicious" : "trusted";
      const daysAgo = Math.random() * 14;
      const startedAt = new Date(now.getTime() - daysAgo * 86400000);
      const reasons: string[] = [];
      if (isFraud) reasons.push("webdriver_detected", "headless_browser_detected", "automation_framework_signature", "datacenter_network", "repeat_fingerprint");
      if (isSuspicious) reasons.push("cursor_entropy_low", "vpn_usage", "source_mismatch", "low_engagement");

      // Human Authenticity Engine scores derived from classification
      const humanScore = isFraud
        ? Math.round(5 + Math.random() * 30)
        : isSuspicious
        ? Math.round(40 + Math.random() * 24)
        : Math.round(72 + Math.random() * 23);
      const humanClassification = isFraud
        ? (Math.random() > 0.4 ? "bot" : "automation")
        : isSuspicious
        ? "suspicious_human"
        : "human";
      const humanDecision = isFraud ? "block" : isSuspicious ? "step_up" : "allow";
      const humanConf = Math.round((0.65 + Math.random() * 0.3) * 100) / 100;

      // Sub-scores correlated with overall human score
      const biScore = Math.round(Math.max(0, Math.min(100, humanScore + (Math.random() * 20 - 10))));
      const behScore = Math.round(Math.max(0, Math.min(100, humanScore + (Math.random() * 20 - 10))));
      const dcScore = Math.round(Math.max(0, Math.min(100, humanScore + (Math.random() * 16 - 8))));
      const netScore = Math.round(Math.max(0, Math.min(100, humanScore + (Math.random() * 16 - 8))));
      const histScore = Math.round(Math.max(0, Math.min(100, humanScore + (Math.random() * 14 - 7))));

      // Traffic Intelligence Engine scores (0-1000 scale)
      const trafficTrustScore = isFraud
        ? Math.round(120 + Math.random() * 280)   // 120-400 high/critical
        : isSuspicious
        ? Math.round(380 + Math.random() * 220)   // 380-600 elevated/medium
        : Math.round(620 + Math.random() * 310);  // 620-930 low/medium
      const trafficRiskTier = trafficTrustScore >= 800 ? "low"
        : trafficTrustScore >= 650 ? "medium"
        : trafficTrustScore >= 500 ? "elevated"
        : trafficTrustScore >= 300 ? "high"
        : "critical";
      const trafficDecision = trafficTrustScore >= 850 ? "allow"
        : trafficTrustScore >= 700 ? "allow_and_monitor"
        : trafficTrustScore >= 550 ? "deprioritize"
        : trafficTrustScore >= 400 ? "challenge"
        : "block_source";
      const trafficConf = Math.round((0.60 + Math.random() * 0.35) * 100) / 100;
      const tBase = trafficTrustScore / 10;
      const tSrc  = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 20 - 10))));
      const tCamp = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 20 - 10))));
      const tEng  = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 16 - 8))));
      const tConv = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 16 - 8))));
      const tRef  = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 14 - 7))));
      const tGeo  = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 14 - 7))));
      const tTemp = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 12 - 6))));
      const tDN   = Math.round(Math.max(0, Math.min(100, tBase + (Math.random() * 12 - 6))));

      sessionInserts.push({
        id: randomUUID(), workspaceId: wid, siteId: site.id, sessionId: `sess_${randomUUID().slice(0, 8)}`,
        fingerprintHash: `fp_${Math.random().toString(36).slice(2, 10)}`,
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: countries[Math.floor(Math.random() * countries.length)]!,
        source: src.source, medium: src.medium, campaign: src.campaign, adSet: src.adSet,
        deviceType: devices[Math.floor(Math.random() * devices.length)]!,
        browser: browsers[Math.floor(Math.random() * browsers.length)]!,
        classification: cls,
        fraudScore: Math.round(100 - humanScore),
        trustScore: humanScore,
        confidence: humanConf,
        action: isFraud ? "block" : isSuspicious ? "review" : "observe",
        reasonCodes: reasons, cost: Math.round(Math.random() * 300 * 100) / 100,
        humanScore,
        humanConfidence: humanConf,
        humanClassification,
        humanDecision,
        browserIntegrityScore: biScore,
        behaviorScore: behScore,
        deviceConsistencyScore: dcScore,
        networkScore: netScore,
        historicalScore: histScore,
        trafficTrustScore,
        trafficQualityScore: Math.round(trafficTrustScore / 10),
        trafficFraudScore: Math.round(100 - trafficTrustScore / 10),
        trafficConfidence: trafficConf,
        trafficRiskTier,
        trafficDecision,
        trafficSourceScore: tSrc,
        trafficCampaignScore: tCamp,
        trafficEngagementScore: tEng,
        trafficConversionScore: tConv,
        trafficReferralScore: tRef,
        trafficGeoScore: tGeo,
        trafficTemporalScore: tTemp,
        trafficDeviceNetworkScore: tDN,
        startedAt,
      });

      if (Math.random() < 0.2) {
        conversionInserts.push({
          id: randomUUID(), workspaceId: wid, siteId: site.id,
          sessionId: sessionInserts[sessionInserts.length - 1]!.sessionId,
          type: Math.random() < 0.5 ? "lead" : "signup",
          status: isFraud ? "suppressed" : isSuspicious ? "flagged" : "observed",
          classification: cls, value: Math.round(Math.random() * 500 * 100) / 100,
          source: src.source, createdAt: startedAt,
        });
      }
    }

    await db.delete(sessionsTable).where(eq(sessionsTable.workspaceId, wid));
    await db.delete(conversionsTable).where(eq(conversionsTable.workspaceId, wid));
    if (sessionInserts.length) await db.insert(sessionsTable).values(sessionInserts);
    if (conversionInserts.length) await db.insert(conversionsTable).values(conversionInserts);

    res.json({ ok: true, sessions_created: sessionInserts.length, conversions_created: conversionInserts.length });
  } catch (err) {
    res.status(500).json({ detail: "Failed to seed demo data", error: String(err) });
  }
});

// ---------- Collect (SDK ingestion) ----------
router.post("/collect", async (req, res) => {
  try {
    const body = req.body as {
      sdk_key?: string;
      session_id?: string;
      fingerprint?: string;
      page?: string;
      referrer?: string;
      utm?: { source?: string; medium?: string; campaign?: string; ad_set?: string };
      signals?: Record<string, unknown>;
      behavior?: Record<string, unknown>;
      event_type?: string;
      conversion?: { type?: string; value?: number; currency?: string };
    };

    const sdkKey = body.sdk_key;
    if (!sdkKey) { res.status(400).json({ detail: "sdk_key required" }); return; }

    const [site] = await db
      .select({ id: sitesTable.id, workspaceId: sitesTable.workspaceId })
      .from(sitesTable)
      .where(eq(sitesTable.sdkKey, sdkKey))
      .limit(1);

    if (!site) { res.status(401).json({ detail: "Invalid SDK key" }); return; }
    const siteId = site.id;

    const sig = body.signals ?? {};
    const beh = body.behavior ?? {};
    const utm = body.utm ?? {};

    const sessionId = body.session_id ?? randomUUID();

    // --- UA parsing ---
    const rawUa = String(sig["user_agent"] ?? req.headers["user-agent"] ?? "");
    const uaResult = rawUa ? new UAParser(rawUa).getResult() : null;
    const parsedBrowser = uaResult?.browser?.name ?? null;
    const parsedOs = uaResult?.os?.name ?? null;
    const uaDevice = uaResult?.device?.type;
    const parsedDevice = uaDevice === "mobile" ? "Mobile"
      : uaDevice === "tablet" ? "Tablet"
      : sig["is_mobile"] ? "Mobile"
      : "Desktop";

    // --- Geo lookup from IP ---
    const rawIp = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.ip
      ?? req.socket.remoteAddress
      ?? "";
    // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4)
    const clientIp = rawIp.replace(/^::ffff:/, "");
    const geo = clientIp ? geoip.lookup(clientIp) : null;
    const parsedCountry = geo?.country ?? null;
    const parsedCity = geo?.city || null;

    // --- Human Authenticity Engine ---
    const humanResult = await scoreHumanAuthenticity({
      signals: sig,
      behavior: beh,
      ip: clientIp,
      geo,
      workspaceId: site.workspaceId,
      fingerprintHash: body.fingerprint ?? null,
    });

    const trustScore = humanResult.humanScore;
    const fraudScore = Math.max(0, Math.round(100 - humanResult.humanScore));
    const classification =
      humanResult.humanClassification === "bot" || humanResult.humanClassification === "automation"
        ? "fraudulent"
        : humanResult.humanClassification === "suspicious_human"
        ? "suspicious"
        : humanResult.humanClassification === "human"
        ? "trusted"
        : "suspicious";
    const action =
      humanResult.humanDecision === "block" ? "block"
      : humanResult.humanDecision === "challenge" ? "flag"
      : humanResult.humanDecision === "step_up" ? "review"
      : "observe";
    // --- Traffic Intelligence Engine ---
    const trafficResult = scoreTrafficIntelligence({
      source: String(utm.source ?? "direct"),
      medium: utm.medium ?? null,
      campaign: utm.campaign ?? null,
      adSet: utm.ad_set ?? null,
      landingPage: body.page ?? null,
      referrer: body.referrer ?? null,
      signals: sig,
      behavior: beh,
      geo,
      ip: clientIp || null,
      deviceType: parsedDevice,
      browser: parsedBrowser,
      os: parsedOs,
    });
    const reasonCodes = [...new Set([...humanResult.reasonCodes, ...trafficResult.reasonCodes])];

    await db.insert(sessionsTable).values({
      id: randomUUID(),
      workspaceId: site.workspaceId,
      siteId,
      sessionId,
      fingerprintHash: body.fingerprint ?? null,
      ip: clientIp || null,
      country: parsedCountry,
      city: parsedCity,
      timezone: String(sig["timezone"] ?? ""),
      source: String(utm.source ?? "direct"),
      medium: utm.medium ?? null,
      campaign: utm.campaign ?? null,
      adSet: utm.ad_set ?? null,
      landingPage: body.page ?? null,
      deviceType: parsedDevice,
      browser: parsedBrowser,
      os: parsedOs,
      ua: rawUa,
      classification,
      fraudScore,
      trustScore,
      confidence: humanResult.humanConfidence,
      action,
      reasonCodes,
      humanScore: humanResult.humanScore,
      humanConfidence: humanResult.humanConfidence,
      humanClassification: humanResult.humanClassification,
      humanDecision: humanResult.humanDecision,
      browserIntegrityScore: humanResult.browserIntegrityScore,
      behaviorScore: humanResult.behaviorScore,
      deviceConsistencyScore: humanResult.deviceConsistencyScore,
      networkScore: humanResult.networkScore,
      historicalScore: humanResult.historicalScore,
      trafficTrustScore: trafficResult.trafficTrustScore,
      trafficQualityScore: trafficResult.trafficQualityScore,
      trafficFraudScore: trafficResult.trafficFraudScore,
      trafficConfidence: trafficResult.trafficConfidence,
      trafficRiskTier: trafficResult.trafficRiskTier,
      trafficDecision: trafficResult.trafficDecision,
      trafficSourceScore: trafficResult.trafficSourceScore,
      trafficCampaignScore: trafficResult.trafficCampaignScore,
      trafficEngagementScore: trafficResult.trafficEngagementScore,
      trafficConversionScore: trafficResult.trafficConversionScore,
      trafficReferralScore: trafficResult.trafficReferralScore,
      trafficGeoScore: trafficResult.trafficGeoScore,
      trafficTemporalScore: trafficResult.trafficTemporalScore,
      trafficDeviceNetworkScore: trafficResult.trafficDeviceNetworkScore,
      startedAt: new Date(),
    }).onConflictDoNothing();

    if (body.event_type === "conversion" && body.conversion) {
      await db.insert(conversionsTable).values({
        id: randomUUID(),
        workspaceId: site.workspaceId,
        siteId,
        sessionId,
        type: body.conversion.type ?? "lead",
        status: classification === "fraudulent" ? "suppressed" : classification === "suspicious" ? "flagged" : "observed",
        classification,
        value: body.conversion.value ?? 0,
        source: String(utm.source ?? "direct"),
      });
    }

    res.json({
      ok: true,
      session_id: sessionId,
      score: {
        classification,
        fraud_score: fraudScore,
        trust_score: trustScore,
        human_score: humanResult.humanScore,
        human_classification: humanResult.humanClassification,
        human_decision: humanResult.humanDecision,
        human_confidence: humanResult.humanConfidence,
        action,
        reason_codes: reasonCodes,
        traffic_trust_score: trafficResult.trafficTrustScore,
        traffic_risk_tier: trafficResult.trafficRiskTier,
        traffic_decision: trafficResult.trafficDecision,
        traffic_quality_score: trafficResult.trafficQualityScore,
        traffic_confidence: trafficResult.trafficConfidence,
      },
    });
  } catch (err) {
    res.status(500).json({ detail: "Collect failed", error: String(err) });
  }
});

// ---------- Meta ----------
// ---------- Page Journey ----------

router.post("/pageview", async (req, res) => {
  try {
    const body = req.body as {
      sdk_key?: string;
      session_id?: string;
      url?: string;
      path?: string;
      title?: string;
      referrer?: string;
      time_on_page_ms?: number;
      scroll_depth_pct?: number;
      entered_at?: string;
    };

    if (!body.sdk_key) { res.status(400).json({ detail: "sdk_key required" }); return; }
    if (!body.session_id || !body.url) { res.status(400).json({ detail: "session_id and url required" }); return; }

    const [site] = await db
      .select({ id: sitesTable.id, workspaceId: sitesTable.workspaceId })
      .from(sitesTable)
      .where(eq(sitesTable.sdkKey, body.sdk_key))
      .limit(1);
    if (!site) { res.status(401).json({ detail: "Invalid SDK key" }); return; }

    const enteredAt = body.entered_at ? new Date(body.entered_at) : new Date();

    await db.insert(pageViewsTable).values({
      id:             randomUUID(),
      sessionId:      body.session_id,
      workspaceId:    site.workspaceId,
      url:            body.url,
      path:           body.path ?? (() => { try { return new URL(body.url!).pathname; } catch { return body.url!; } })(),
      title:          body.title ?? null,
      referrer:       body.referrer ?? null,
      timeOnPageMs:   body.time_on_page_ms ?? null,
      scrollDepthPct: body.scroll_depth_pct ?? null,
      enteredAt,
      exitedAt:       body.time_on_page_ms != null
        ? new Date(enteredAt.getTime() + body.time_on_page_ms)
        : null,
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ detail: "Failed to record pageview" });
  }
});

router.get("/sessions/:sid/journey", requireAuth, async (req, res) => {
  try {
    const wid = wsId(req);
    const [session] = await db
      .select({ sessionId: sessionsTable.sessionId })
      .from(sessionsTable)
      .where(and(eq(sessionsTable.id, req.params.sid!), eq(sessionsTable.workspaceId, wid)))
      .limit(1);
    if (!session) { res.status(404).json({ detail: "Session not found" }); return; }

    const pages = await db
      .select()
      .from(pageViewsTable)
      .where(eq(pageViewsTable.sessionId, session.sessionId))
      .orderBy(pageViewsTable.enteredAt);

    res.json({ pages });
  } catch {
    res.status(500).json({ detail: "Failed to load journey" });
  }
});

router.get("/meta/reason-codes", (_req, res) => {
  res.json({ reason_codes: Object.entries(REASON_CODES).map(([code, v]) => ({ code, ...v })) });
});

export default router;
