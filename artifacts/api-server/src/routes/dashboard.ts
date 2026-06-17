import { Router } from "express";
import { randomUUID, randomBytes } from "crypto";
import { db } from "@workspace/db";
import {
  usersTable, workspacesTable, sitesTable, sessionsTable, conversionsTable,
  rulesTable, investigationsTable, alertsTable, integrationsTable,
  auditLogsTable, fraudClustersTable,
} from "@workspace/db";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireRole, publicUser } from "../lib/auth.js";
import { hashPassword } from "../lib/auth.js";

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
      },
      distribution: [
        { name: "trusted", value: byCls["trusted"] ?? 0 },
        { name: "suspicious", value: byCls["suspicious"] ?? 0 },
        { name: "fraudulent", value: byCls["fraudulent"] ?? 0 },
      ],
      trend,
      by_source: bySource,
      top_reasons: topReasons,
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
      if (isFraud) reasons.push("datacenter_ip_origin", "headless_browser_indicators");
      if (isSuspicious) reasons.push("vpn_usage");

      sessionInserts.push({
        id: randomUUID(), workspaceId: wid, siteId: site.id, sessionId: `sess_${randomUUID().slice(0, 8)}`,
        fingerprintHash: `fp_${Math.random().toString(36).slice(2, 10)}`,
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: countries[Math.floor(Math.random() * countries.length)]!,
        source: src.source, medium: src.medium, campaign: src.campaign, adSet: src.adSet,
        deviceType: devices[Math.floor(Math.random() * devices.length)]!,
        browser: browsers[Math.floor(Math.random() * browsers.length)]!,
        classification: cls, fraudScore: isFraud ? 70 + Math.random() * 30 : isSuspicious ? 30 + Math.random() * 30 : Math.random() * 20,
        trustScore: isFraud ? Math.random() * 30 : isSuspicious ? 40 + Math.random() * 30 : 75 + Math.random() * 25,
        confidence: 0.7 + Math.random() * 0.3, action: isFraud ? "block" : isSuspicious ? "review" : "observe",
        reasonCodes: reasons, cost: Math.round(Math.random() * 300 * 100) / 100,
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

    const headlessScore = Number(sig["headless_score"] ?? 0);
    const webdriver = !!sig["webdriver"];
    const noPlugins = Number(sig["plugins_count"] ?? 0) === 0;
    const noLangs = Number(sig["languages_count"] ?? 0) === 0;
    const interactionDepth = Number(beh["mouse_event_count"] ?? 0) + Number(beh["click_count"] ?? 0);

    const reasonCodes: string[] = [];
    if (webdriver) reasonCodes.push("browser_automation_detected");
    if (headlessScore > 30) reasonCodes.push("headless_browser_indicators");
    if (noPlugins) reasonCodes.push("missing_browser_plugins");
    if (noLangs) reasonCodes.push("no_language_preferences");
    if (interactionDepth < 3 && Number(beh["session_duration_ms"] ?? 9999) < 2000) {
      reasonCodes.push("instant_bounce_timing");
    }

    const fraudScore =
      (webdriver ? 60 : 0) +
      (headlessScore > 30 ? 20 : 0) +
      (noPlugins ? 10 : 0) +
      (noLangs ? 5 : 0) +
      (interactionDepth < 3 ? 5 : 0);

    const classification =
      fraudScore >= 60 ? "fraudulent" : fraudScore >= 25 ? "suspicious" : "trusted";
    const trustScore = Math.max(0, 100 - fraudScore);
    const action = classification === "fraudulent" ? "block" : classification === "suspicious" ? "review" : "observe";

    const sessionId = body.session_id ?? randomUUID();

    await db.insert(sessionsTable).values({
      id: randomUUID(),
      workspaceId: site.workspaceId,
      siteId,
      sessionId,
      fingerprintHash: body.fingerprint ?? null,
      source: String(utm.source ?? "direct"),
      medium: utm.medium ?? null,
      campaign: utm.campaign ?? null,
      adSet: utm.ad_set ?? null,
      landingPage: body.page ?? null,
      deviceType: sig["is_mobile"] ? "Mobile" : "Desktop",
      ua: String(sig["user_agent"] ?? ""),
      timezone: String(sig["timezone"] ?? ""),
      classification,
      fraudScore,
      trustScore,
      confidence: 0.75,
      action,
      reasonCodes,
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
      score: { classification, fraud_score: fraudScore, trust_score: trustScore, action, reason_codes: reasonCodes },
    });
  } catch (err) {
    res.status(500).json({ detail: "Collect failed", error: String(err) });
  }
});

// ---------- Meta ----------
router.get("/meta/reason-codes", (_req, res) => {
  res.json({ reason_codes: Object.entries(REASON_CODES).map(([code, v]) => ({ code, ...v })) });
});

export default router;
