---
name: PoH SDK package
description: Location, structure, and conventions for the @workspace/sdk client SDK package
---

## Package

`lib/sdk` — `@workspace/sdk` v2.0.0

## What it covers

Four engine clients:
- **Human Authenticity** (`/v1/human/analyze`, `/explain/:id`, `/feedback`) — browser signal collection + bot detection
- **Traffic Intelligence** (`/v1/traffic/score`, `/explain/:id`, `/feedback`) — source/campaign/engagement scoring
- **Revenue Protection** (`/v1/revenue/score`, `/explain/:id`, `/feedback`) — chargeback/refund/promo risk
- **Analytics & Operations** (`/v1/analytics/*`, `/v1/operations/*`) — metrics, dashboards, alerts, queues, reports, forecasts

Trust Intelligence Engine is intentionally deferred — add `lib/sdk/src/engines/trust.ts` + types when specs arrive.

## Key conventions

- All HTTP goes through `HttpClient` (`src/utils/http.ts`) — single fetch wrapper with timeout, auth headers, and typed errors
- `PoHClient` is the friendly entry point: auto-collects device/behavior signals and exposes `analyzeHuman()` / `scoreTraffic()` convenience methods
- `BehaviorCollector` attaches DOM listeners on construction (mousemove, keydown/up, scroll, paste); call `.detach()` to clean up
- Types use `.js` import extensions (ESM) — this is required even for `.ts` source files in this workspace

## Why SDK version is 2.0.0

Matches the Human Authenticity Engine spec's stated SDK version (2.x.x).
