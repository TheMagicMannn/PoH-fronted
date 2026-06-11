# PoH — Trust & Fraud Intelligence Platform (PRD / Living Doc)

## Original problem statement
Build "PoH", a web-based fraud detection & trust intelligence SaaS for performance marketers, agencies, e-commerce and lead-gen teams. Score traffic (human vs bot), detect fraudulent sessions & conversions, link fraud to campaigns, and let teams take action (observe/flag/review/block) with explainable reason codes + confidence. Positioning: "The trust & fraud intelligence layer for paid traffic, leads and conversions." Long term: privacy-safe trust intelligence network.

## User choices locked (v1)
- Scope: Full core dashboard (Overview, Sessions, Conversions, Campaigns, Rules, Investigations, Integrations, Settings) + working SDK ingestion/scoring.
- Auth: JWT email/password, multi-tenant workspaces + roles (owner/admin/analyst/viewer).
- Integrations: GA4 / Google Ads / Meta Ads / Webhook / HubSpot — UI built, connections SIMULATED.
- Data: seeded demo data + a real drop-in `poh.js` SDK for live scored events.
- Design: distinctive dark forensic "command-center" SaaS (Chivo + IBM Plex Sans/Mono, semantic status colors).

## Tech architecture
- Backend: FastAPI (modular: db.py, models.py, scoring.py, auth.py, sdk_routes.py, sdk_script.py, dashboard_routes.py, seed.py, server.py), MongoDB (motor).
- Frontend: React (CRA + craco, JSX), react-router, @tanstack/react-query, recharts, @phosphor-icons/react, shadcn/ui primitives, Tailwind.
- Auth: bcrypt hashing, JWT httpOnly cookies (secure, samesite=none) + Bearer fallback, brute-force lockout, refresh tokens, idempotent admin seed.
- Scoring: deterministic layered-evidence engine (behavioral, fingerprint, headless/automation, proxy/VPN/datacenter, recurrence, click-to-conversion timing) → fraud/trust/confidence + reason codes. Rules engine + sensitivity profiles (conservative/balanced/aggressive) → observe/flag/review/block.
- SDK: `/api/poh.js` self-configuring client collecting device + behavioral signals; `/api/collect` & `/api/convert` ingest + score in real time.

## Personas
- Head of Growth / Paid Media Manager (campaign trust + ROAS), RevOps/Sales Ops (lead quality), E-commerce growth (fake sessions/checkout), Fraud/Risk lead (later).

## What's implemented (2026-06-11)
- ✅ IPQS real-time IP threat-intel enrichment wired into live ingestion (proxy/VPN/Tor/datacenter → scoring signals + `ip_intel` on session docs). Regression tests: `backend/tests/test_ipqs_wiring.py` (6 pass).
- ✅ Auth (register→new workspace+SDK key→onboarding; login; me; logout; refresh; forgot/reset; brute force).
- ✅ Executive Overview: KPIs (sessions, invalid traffic %, wasted spend, invalid conversion %, blocked), trend area chart, trust donut, fraud-by-source, top reason codes, range selector.
- ✅ Session Intelligence: filterable/paginated table + forensic detail drawer (trust gauge, reason codes, device/behavioral signals, campaign mapping, manual Trust/Review/Block).
- ✅ Conversions: scored table + KPIs, filters, per-row Accept/Review/Suppress/Block.
- ✅ Campaign Quality: aggregation by source/campaign/ad set with quality-mix bars, fraud rate, spend, wasted.
- ✅ Rules & Actions: baseline sensitivity card, create/toggle/delete custom if-then rules.
- ✅ Investigations: fraud clusters (repeated fingerprints) + investigation cases (open from cluster, status updates).
- ✅ Integrations: GA4/Google Ads/Meta/Webhook/HubSpot cards, connect/disconnect (SIMULATED), sync metrics.
- ✅ Settings: sensitivity profile, team members (invite/remove, roles), audit log.
- ✅ Onboarding: SDK snippet + key, conversion mapping code, "Send test session" (live scored), "Load sample data".
- ✅ Real `poh.js` SDK + ingestion; demo seeder (~460 sessions / 80 conversions / 4 clusters / rules / integrations / alerts / audit).
- ✅ Testing: backend 26/26 pytest pass; frontend flows verified; register→onboarding + a11y fixes applied.

## Status of integrations
- IPQualityScore (IPQS): **LIVE / WIRED** — server-side proxy/VPN/Tor/datacenter enrichment on `/api/collect` + `/api/convert`. Real client IP resolved via `X-Forwarded-For`/`X-Real-IP`. Per-IP results cached in `ip_reputation` with TTL (default 24h) to conserve credits. Graceful no-op when key/credits absent. Key stored in `IPQS_API_KEY`. (User's IPQS account currently shows "insufficient credits" — enrichment activates automatically once credits are topped up.)
- GA4 / Google Ads / Meta Ads / Webhook / HubSpot: **SIMULATED** (UI + persisted state + fake sync metrics). Real OAuth pending user credentials.

## Prioritized backlog
- P1: CRM enrichment/export (real HubSpot), weekly trust report emails, bulk export API, saved views/filters.
- P1: Real GA4/Google Ads/Meta OAuth once credentials available; conversion suppression write-back where allowed.
- P2: Alerts/anomaly detection engine, allowlist/blocklist, white-label agency reporting, plans/billing.
- P3 (network vision): adaptive fraud memory graph, cross-workspace abstracted fingerprint recurrence, Trust API, reputation feeds, signal decay/rehabilitation.

## Next tasks
1. Wire one real integration end-to-end (likely GA4 read or Webhook outbound) when keys provided.
2. Add CSV/PDF export for campaign + session reports.
3. Add scheduled "weekly trust digest" email (SendGrid/Resend).

## Credentials
- Demo owner: analyst@poh.io / PohDemo2026! (see /app/memory/test_credentials.md).
