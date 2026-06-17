# PoH — Trust & Fraud Intelligence

A fraud detection and trust intelligence platform that scores sessions and conversions in real time, detecting bots, proxies, and fraudulent traffic.

## Run & Operate

- `pnpm --filter @workspace/app run dev` — run the frontend (Vite dev server)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/app), react-router-dom, Tailwind CSS v4, shadcn/ui
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/app/src/` — React frontend source
  - `pages/` — route pages (marketing, auth, dashboard)
  - `components/layout/` — AppLayout, Sidebar, Topbar
  - `components/marketing/` — marketing site components (Nav, Footer, Preloader, pages)
  - `components/common/` — shared cards, badges, controls
  - `components/ui/` — shadcn UI primitives
  - `context/AuthContext.jsx` — authentication state
  - `lib/api.js` — axios client (base URL from `VITE_BACKEND_URL`)
  - `lib/format.js` — number/date formatting, status config maps
- `artifacts/api-server/` — Express backend
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema

## Architecture decisions

- Frontend is a CRA → Vite migration: `.js`/`.jsx` source files treated as JSX via `esbuild.loader: "tsx"` and `react({ include: /\.(jsx?|tsx?)$/ })` in vite.config.ts
- The original app used a Python Flask backend; the Replit stack uses Express (api-server artifact)
- API base URL is configurable via `VITE_BACKEND_URL` env var (defaults to empty string = same origin)
- Marketing site has an animated "Initializing Trust Protocol" preloader (~1.7s) on first visit per session
- Dark-only theme: deep navy/black palette with green (#34D399 trusted), amber (#FBBF24 suspicious), red (#F87171 fraudulent), blue (#60A5FA review) status colors

## Product

- Marketing site: homepage, about, products, pricing, resources, support pages
- Auth: email/password login and registration
- Dashboard: overview, sessions, conversions, campaigns, rules, investigations, integrations, settings, onboarding
- Real-time fraud scoring with explainable reason codes
- Session fingerprinting and recurrence detection

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `.js` source files contain JSX — Vite requires `esbuild.loader: "tsx"` and react plugin with `include: /\.(jsx?|tsx?)/` to handle them
- The preloader runs ~2.1s on first page load (marketing routes only); clear `sessionStorage.poh_preloaded` to re-trigger it
- Do NOT run `pnpm dev` at workspace root — use `pnpm --filter @workspace/app run dev`
- Backend API was originally Python Flask; the Express api-server needs to replicate those routes for full functionality

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
