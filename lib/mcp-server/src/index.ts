/**
 * PoH Trust & Fraud Intelligence — MCP Server v1.0.0
 *
 * Exposes 16 tools, 2 resources, and 3 prompts so AI agents (Claude, GPT-4o,
 * Cursor, Windsurf, Zed, LangGraph, etc.) can query, analyse, and act on
 * fraud & trust data from a PoH workspace over the MCP protocol.
 *
 * Configuration (environment variables):
 *   POH_API_URL   — PoH API base URL (default: https://po-h-replit.replit.app/api)
 *   POH_API_TOKEN — Pre-obtained JWT bearer token        (takes priority over email/password)
 *   POH_EMAIL     — Workspace email for auto-login       (used when no POH_API_TOKEN)
 *   POH_PASSWORD  — Workspace password for auto-login   (used when no POH_API_TOKEN)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { z } from "zod";

// ─── Configuration ────────────────────────────────────────────────────────────

const API_URL  = (process.env["POH_API_URL"]   ?? "https://po-h-replit.replit.app/api").replace(/\/$/, "");
const EMAIL    =  process.env["POH_EMAIL"]    ?? "";
const PASSWORD =  process.env["POH_PASSWORD"] ?? "";
let   TOKEN    =  process.env["POH_API_TOKEN"] ?? "";

// ─── HTTP Client ─────────────────────────────────────────────────────────────

const http = axios.create({ baseURL: API_URL, timeout: 15_000 });

async function ensureAuth(): Promise<void> {
  if (TOKEN) return;
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "PoH MCP: authentication required.\n" +
      "  Set POH_API_TOKEN=<jwt>  OR  POH_EMAIL + POH_PASSWORD in the environment."
    );
  }
  const { data } = await http.post<{ token: string }>("/auth/login", { email: EMAIL, password: PASSWORD });
  TOKEN = data.token;
}

async function get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
  await ensureAuth();
  const { data } = await http.get<T>(path, { headers: { Authorization: `Bearer ${TOKEN}` }, params });
  return data;
}

async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  await ensureAuth();
  const { data } = await http.post<T>(path, body, { headers: { Authorization: `Bearer ${TOKEN}` } });
  return data;
}

// ─── Response helpers ────────────────────────────────────────────────────────

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name:    "poh-fraud-intelligence",
  version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLS  (16 total)
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Dashboard Overview ────────────────────────────────────────────────────
server.tool(
  "get_overview",
  "Get the full fraud & trust dashboard overview: KPIs (total sessions, fraud rate, wasted ad spend), daily trend, breakdown by source / country / device / browser / OS, hourly attack patterns, score distribution histogram, and per-engine analytics (Human Authenticity, Traffic Intelligence, Revenue Protection, Device Intelligence).",
  {
    days: z.number().int().min(1).max(90).default(14)
      .describe("Number of days to include (1–90, default 14)"),
  },
  async ({ days }) => json(await get("/overview", { days }))
);

// ── 2. Platform Health ────────────────────────────────────────────────────────
server.tool(
  "get_health",
  "Get the real-time platform health score (0–100), current fraud burst level, active alert count, and rolling metrics for 1 h / 24 h / 7 d / 30 d windows. Use as a quick pulse check before deeper analysis.",
  {},
  async () => json(await get("/analytics/health"))
);

// ── 3. List Sessions ─────────────────────────────────────────────────────────
server.tool(
  "list_sessions",
  "Query scored sessions with optional filters. Returns paginated results including all engine scores: TIE composite (0–1000), Human Authenticity, Traffic Intelligence, Revenue Protection, Device Intelligence, reason codes, device/geo info, and recommended action.",
  {
    page:           z.number().int().min(1).default(1).describe("Page number (default 1)"),
    page_size:      z.number().int().min(1).max(200).default(50).describe("Results per page (max 200)"),
    classification: z.enum(["trusted", "suspicious", "fraudulent"]).optional()
                     .describe("Filter by fraud verdict"),
    source:         z.string().optional().describe("Filter by traffic source, e.g. 'google'"),
    campaign:       z.string().optional().describe("Filter by campaign name"),
    action:         z.enum(["block", "review", "step_up", "observe"]).optional()
                     .describe("Filter by recommended action"),
    days:           z.number().int().min(1).max(90).default(14).describe("Look-back window in days"),
  },
  async (params) => json(await get("/sessions", params))
);

// ── 4. Get Session Detail ────────────────────────────────────────────────────
server.tool(
  "get_session",
  "Get the complete forensic detail for a single session. Returns the TIE composite trust score (0–1000) with all 8 module scores, Human Authenticity, Traffic Intelligence, Revenue Protection, Device Intelligence scores, reason codes, positive/negative signals, fingerprint, IP, geo, device, and linked conversions.",
  {
    session_id: z.string().describe("Internal session UUID (from list_sessions items[].id)"),
  },
  async ({ session_id }) => json(await get(`/sessions/${session_id}`))
);

// ── 5. Take Session Action ───────────────────────────────────────────────────
server.tool(
  "take_session_action",
  "Manually override a session verdict. Use 'block' to immediately block the session, 'trust' to mark it verified, or 'flag' to escalate for analyst review. Writes an audit log entry.",
  {
    session_id: z.string().describe("Internal session UUID"),
    action:     z.enum(["block", "trust", "flag"]).describe("Action to apply"),
    reason:     z.string().optional().describe("Optional reason for the override (shown in audit log)"),
  },
  async ({ session_id, action, reason }) => json(await post(`/sessions/${session_id}/action`, { action, reason }))
);

// ── 6. List Campaigns ────────────────────────────────────────────────────────
server.tool(
  "list_campaigns",
  "Get fraud analysis aggregated per campaign. Each row shows total sessions, trusted / suspicious / fraudulent counts, fraud rate (%), estimated ad spend, and wasted spend from invalid traffic. Essential for identifying which campaigns are polluted and should be paused or adjusted.",
  {
    days:      z.number().int().min(1).max(90).default(14).describe("Look-back window in days"),
    source:    z.string().optional().describe("Filter by source, e.g. 'google' or 'meta'"),
    min_fraud: z.number().min(0).max(100).optional()
                .describe("Only return campaigns with fraud rate >= this % (0–100)"),
  },
  async ({ days, source, min_fraud }) => {
    const data = await get<{ campaigns: Array<Record<string, unknown>> }>("/campaigns", { days, source });
    let campaigns = data.campaigns ?? [];
    if (min_fraud !== undefined) {
      campaigns = campaigns.filter((c) => ((c["fraud_rate"] as number) ?? 0) >= min_fraud);
    }
    return json({ campaigns, total: campaigns.length });
  }
);

// ── 7. List Conversions ──────────────────────────────────────────────────────
server.tool(
  "list_conversions",
  "List scored conversions (leads, signups, purchases). Each record includes the session's fraud classification, TIE trust score, revenue value, and PoH's action recommendation (observe / flag / suppress).",
  {
    page:           z.number().int().min(1).default(1),
    page_size:      z.number().int().min(1).max(200).default(50),
    classification: z.enum(["trusted", "suspicious", "fraudulent"]).optional(),
    type:           z.enum(["lead", "signup", "purchase"]).optional()
                     .describe("Filter by conversion type"),
    days:           z.number().int().min(1).max(90).default(14),
  },
  async (params) => json(await get("/conversions", params))
);

// ── 8. List Investigations ───────────────────────────────────────────────────
server.tool(
  "list_investigations",
  "List all fraud investigation cases. Each investigation tracks a suspected fraud pattern — cluster, IP range, campaign anomaly — with its status (open / closed), severity, linked sessions, and assigned analyst.",
  {},
  async () => json(await get("/investigations"))
);

// ── 9. Create Investigation ──────────────────────────────────────────────────
server.tool(
  "create_investigation",
  "Open a new fraud investigation case. Use this when you've found a suspicious pattern that needs tracking. The investigation appears in the PoH dashboard for the team.",
  {
    title:       z.string().min(3).describe("Short descriptive title for the investigation"),
    description: z.string().describe("Detailed description of the suspected fraud pattern"),
    severity:    z.enum(["low", "medium", "high", "critical"]).default("medium"),
    session_ids: z.array(z.string()).optional().describe("Session UUIDs to link to this case"),
  },
  async (body) => json(await post("/investigations", body))
);

// ── 10. List Fraud Clusters ──────────────────────────────────────────────────
server.tool(
  "list_fraud_clusters",
  "List identified fraud clusters — groups of sessions sharing device fingerprints, IP ranges, or behavioral signatures indicative of an organised attack. Each cluster shows affected session count, estimated spend impact, and top detection reason codes.",
  {},
  async () => json(await get("/clusters"))
);

// ── 11. List Alerts ──────────────────────────────────────────────────────────
server.tool(
  "list_alerts",
  "Fetch the last 100 platform alerts plus the current unread count. Alerts fire on fraud spikes, campaign anomalies, fraud cluster detections, and custom rule triggers.",
  {},
  async () => json(await get("/alerts"))
);

// ── 12. List Rules ───────────────────────────────────────────────────────────
server.tool(
  "list_rules",
  "List all custom detection rules. Rules evaluate conditions against every scored session and fire an action automatically when all conditions match (AND logic).",
  {},
  async () => json(await get("/rules"))
);

// ── 13. Create Rule ──────────────────────────────────────────────────────────
server.tool(
  "create_rule",
  "Create a custom fraud detection rule with one or more conditions (AND logic). When all conditions match, the specified action fires automatically.",
  {
    name: z.string().min(2).describe("Human-readable rule name"),
    conditions: z.array(
      z.object({
        field:    z.string().describe("Session field, e.g. 'fraud_score', 'tie_trust_score', 'country', 'source'"),
        operator: z.enum(["gt", "lt", "gte", "lte", "eq", "neq", "contains", "in"]),
        value:    z.union([z.string(), z.number(), z.array(z.string())])
                   .describe("Comparison value or array of values for 'in'"),
      })
    ).min(1).describe("Conditions (all must match — AND logic)"),
    action:  z.enum(["block", "flag", "review", "allow", "notify"]).describe("Action when rule fires"),
    enabled: z.boolean().default(true).describe("Whether the rule is active immediately"),
  },
  async (body) => json(await post("/rules", body))
);

// ── 14. Score a Session in Real Time ─────────────────────────────────────────
server.tool(
  "score_session",
  "Submit signals for real-time fraud scoring via the PoH /collect endpoint. Returns the TIE composite score (0–1000), all sub-engine scores, classification (trusted/suspicious/fraudulent), recommended action, and reason codes. Useful for testing signals or scoring programmatic traffic.",
  {
    sdk_key:     z.string().describe("Site SDK key (from get_workspace_info sites[].sdk_key)"),
    fingerprint: z.string().optional().describe("Device fingerprint hash"),
    ip:          z.string().optional().describe("Client IP address to score"),
    user_agent:  z.string().optional().describe("Full User-Agent string"),
    page:        z.string().optional().describe("Page URL"),
    source:      z.string().optional().describe("UTM source (e.g. 'google')"),
    medium:      z.string().optional().describe("UTM medium (e.g. 'cpc')"),
    campaign:    z.string().optional().describe("UTM campaign name"),
    signals:     z.record(z.unknown()).optional()
                  .describe("Additional raw browser/device signals object"),
  },
  async ({ sdk_key, fingerprint, ip, user_agent, page, source, medium, campaign, signals }) => {
    const data = await post("/collect", {
      sdk_key,
      fingerprint: fingerprint ?? `mcp_${Date.now()}`,
      ip,
      page,
      signals: { user_agent: user_agent ?? "PoH-MCP/1.0", ...(signals ?? {}) },
      utm: source ? { source, medium, campaign } : undefined,
    });
    return json(data);
  }
);

// ── 15. Workspace Info ────────────────────────────────────────────────────────
server.tool(
  "get_workspace_info",
  "Get the current workspace details (name, plan, member count) and all configured sites. Each site includes its SDK key (needed for score_session), domain, verification status, and total session count.",
  {},
  async () => {
    const [workspace, sites] = await Promise.all([get("/workspace"), get("/sites")]);
    return json({ workspace, sites });
  }
);

// ── 16. Reason Code Catalogue ─────────────────────────────────────────────────
server.tool(
  "get_reason_codes",
  "Get the full catalogue of PoH detection reason codes with their human-readable labels and categories (bot_detection, proxy_detection, behavioural, network, device, revenue, traffic). Use this to interpret the reason_codes arrays returned by other tools.",
  {},
  async () => json(await get("/meta/reason-codes"))
);

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCES  (live data, readable by the agent at any time)
// ═══════════════════════════════════════════════════════════════════════════════

server.resource(
  "overview",
  "poh://overview",
  {
    mimeType:    "application/json",
    description: "Live fraud dashboard overview for the last 7 days — KPIs, trends, and breakdowns.",
  },
  async (_uri: URL) => {
    const data = await get("/overview", { days: 7 });
    return {
      contents: [{
        uri:      "poh://overview",
        mimeType: "application/json",
        text:     JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.resource(
  "health",
  "poh://health",
  {
    mimeType:    "application/json",
    description: "Real-time platform health score (0–100), fraud burst level, and rolling metrics.",
  },
  async (_uri: URL) => {
    const data = await get("/analytics/health");
    return {
      contents: [{
        uri:      "poh://health",
        mimeType: "application/json",
        text:     JSON.stringify(data, null, 2),
      }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS  (structured analysis templates that orchestrate multiple tool calls)
// ═══════════════════════════════════════════════════════════════════════════════

server.prompt(
  "analyze_campaign_fraud",
  "Generate a structured fraud analysis for a specific ad campaign — invalid traffic rate, financial impact, top reason codes, engine scores, and recommended remediation steps.",
  {
    campaign_name: z.string().describe("The exact campaign name to analyse"),
    days:          z.number().int().min(1).max(90).default(14).describe("Look-back window in days"),
  },
  async ({ campaign_name, days }) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Use the PoH MCP tools to produce a comprehensive fraud analysis for the campaign **"${campaign_name}"** over the last **${days} days**.

Steps:
1. Call \`list_campaigns\` (days=${days}) and find "${campaign_name}" in the results.
2. Call \`list_sessions\` (campaign="${campaign_name}", days=${days}, page_size=200) for raw sessions.
3. Call \`get_overview\` (days=${days}) for platform-wide baselines to compare against.
4. Call \`get_reason_codes\` to resolve all reason code labels.

Report format:

## Campaign Fraud Analysis — ${campaign_name}
*Period: Last ${days} days*

### Executive Summary
- Overall fraud rate vs. platform average
- Estimated wasted spend ($) and % of budget
- PoH recommendation (pause / reduce / monitor / safe)

### Traffic Quality Breakdown
Trusted / Suspicious / Fraudulent session counts with ASCII bar chart.

### Average Engine Scores
| Engine | Score | Interpretation |
|--------|-------|----------------|
| TIE Composite (0–1000) | | |
| Human Authenticity (0–100) | | |
| Traffic Intelligence (0–1000) | | |

### Top 5 Fraud Signals
Ranked by frequency with % occurrence and plain-English explanation.

### Recommended Actions
Concrete steps: IP exclusions, geo blocks, placement exclusions, bid adjustments, keyword negatives.

### Baseline Comparison
How this campaign's fraud rate compares to the workspace average.`,
      },
    }],
  })
);

server.prompt(
  "investigate_session",
  "Forensic deep-dive on a single session — explains every score and signal in plain English and recommends whether to block, step-up, or trust.",
  {
    session_id: z.string().describe("Internal session UUID to investigate"),
  },
  async ({ session_id }) => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Use \`get_session\` to fetch full details for session **${session_id}**, then \`get_reason_codes\` to resolve all reason code labels. Produce a forensic analysis:

## Session Investigation — ${session_id}

### Verdict
State the classification, recommended action, and your confidence level.

### TIE Composite Score (0–1000)
Overall score and each of the 8 module scores explained in plain English:
- Human Intelligence (20% weight)
- Behavioral (15%)
- Device Intelligence (15%)
- Network Intelligence (10%)
- Identity Intelligence (10%)
- Traffic Intelligence (10%)
- Graph Intelligence (10%)
- Fraud Inverse (10%)

### Human Authenticity Engine
Score, classification (human / suspicious_human / automation / bot), sub-scores.

### Key Evidence
**Positive signals** — why we trust this session.
**Risk signals** — why we're suspicious.
All reason codes with resolved labels and categories.

### Device & Network Profile
IP, country, city, browser, OS, device type, fingerprint hash, and any anomalies.

### Linked Conversions
Any conversions associated with this session and their status.

### Recommendation
Block / step-up / monitor / allow — with concrete justification.`,
      },
    }],
  })
);

server.prompt(
  "fraud_weekly_report",
  "Generate a comprehensive weekly fraud intelligence report — all KPIs, trends, top threats, campaign analysis, open investigations, and recommended actions for the next 7 days.",
  {},
  async () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Use the PoH MCP tools to generate a **Weekly Fraud Intelligence Report**:

1. \`get_health\` — current platform health
2. \`get_overview\` (days=7) — this week's KPIs
3. \`get_overview\` (days=14) — previous period for trend comparison  
4. \`list_campaigns\` (days=7) — campaign-level fraud rates
5. \`list_investigations\` — open cases
6. \`list_alerts\` — recent alerts
7. \`list_fraud_clusters\` — active bot clusters
8. \`get_reason_codes\` — resolve all code labels

# PoH Weekly Fraud Intelligence Report
*Period: Last 7 days vs. prior 7 days*

## Executive Summary
3-sentence overview of the fraud landscape this week.

## Platform Health
Health score (0–100), fraud burst level, trend direction.

## Key Metrics
| Metric | This Week | Last Week | Δ |
|--------|-----------|-----------|---|
| Total Sessions | | | |
| Fraud Rate % | | | |
| Wasted Spend | | | |
| Conversions Suppressed | | | |
| TIE Avg Score | | | |

## Top Threat Vectors
Top 5 reason codes by frequency this week with % occurrence.

## Highest-Risk Campaigns
Top 5 campaigns by fraud rate with spend impact and recommended action.

## Active Investigations
List all open cases with status, severity, and last update.

## Fraud Clusters
Number of active clusters, total impacted sessions, top cluster summary.

## Score Distribution
ASCII histogram of TIE composite scores for the week.

## Recommended Actions for Next 7 Days
Prioritised list of concrete steps (budget adjustments, rule additions, investigations to open).`,
      },
    }],
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  if (!TOKEN && (!EMAIL || !PASSWORD)) {
    process.stderr.write(
      "[poh-mcp] ⚠  No credentials found. Set POH_API_TOKEN or POH_EMAIL + POH_PASSWORD.\n"
    );
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[poh-mcp] ✓ Connected to ${API_URL}\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`[poh-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
