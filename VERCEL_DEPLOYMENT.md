# PoH — Vercel Deployment Guide

A complete, step-by-step guide to deploying this monorepo to Vercel: React + Vite frontend on Vercel's CDN and the Express API as a serverless function.

---

## Architecture on Vercel

```
https://your-app.vercel.app/
├── /             → React SPA (Vite static build, served from CDN)
├── /api/*        → Express serverless function (Node.js 20 runtime)
└── /api/poh.js   → Browser SDK bundle (served by Express)
```

Requests to `/api/*` are handled by a single Vercel Node.js function that wraps your Express app. Everything else is served as static files from the CDN.

---

## Step 1 — Provision an External PostgreSQL Database

Replit's built-in Postgres is not reachable from Vercel. You need an external database. **Neon** is the recommended choice (Vercel's official Postgres partner, generous free tier).

### Option A: Neon (recommended)

1. Go to **[neon.tech](https://neon.tech)** and create a free account.
2. Create a new project (any region close to your users).
3. Neon creates a default database named `neondb`. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Push your schema to Neon:
   ```bash
   DATABASE_URL="your-neon-connection-string" pnpm --filter @workspace/db run push
   ```
5. Seed demo data (optional):
   ```bash
   DATABASE_URL="your-neon-connection-string" node artifacts/api-server/dist/index.mjs seed
   ```

### Option B: Supabase

1. Go to **[supabase.com](https://supabase.com)** and create a free project.
2. In **Settings → Database**, copy the **Connection string (URI)** under "Connection pooling" (Transaction mode, port 6543).
3. Append `?pgbouncer=true` to the connection string if using pooling mode.
4. Push schema: same command as above with the Supabase URL.

---

## Step 2 — Install the Vercel CLI

```bash
npm install -g vercel
```

Then log in:
```bash
vercel login
```

---

## Step 3 — Link the Project to Vercel

From the repo root:
```bash
vercel link
```

Follow the prompts:
- **Set up and deploy?** → `y`
- **Which scope?** → your account or team
- **Link to existing project?** → `N` (create new)
- **Project name** → `poh` (or any name you want)
- **Root directory** → `.` (repo root, the default)

This creates a `.vercel/` directory. Add it to `.gitignore` if it isn't already:
```bash
echo ".vercel" >> .gitignore
```

---

## Step 4 — Set Environment Variables

Set each variable in Vercel. You can do this via the CLI or the Vercel dashboard.

### Via CLI (recommended for secrets)

```bash
# Required — your Neon or Supabase connection string
vercel env add DATABASE_URL production

# Required — a random secret for signing JWT tokens
# Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
vercel env add JWT_SECRET production

# Set to production
vercel env add NODE_ENV production
# When prompted, enter: production

# Your Vercel deployment URL (used for password-reset emails)
# Fill in after your first deploy — see Step 6
vercel env add APP_URL production
```

### Via Vercel Dashboard

1. Go to your project → **Settings → Environment Variables**
2. Add each variable below:

| Variable | Value | Where to get it |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Neon / Supabase dashboard |
| `JWT_SECRET` | 64-char hex string | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `production` | Hard-coded |
| `APP_URL` | `https://your-app.vercel.app` | After first deploy (see Step 6) |

> **Note**: `PORT` and `BASE_PATH` are **not needed** on Vercel — the vite build defaults `BASE_PATH` to `/` and `PORT` is only required in dev mode.

---

## Step 5 — Test the Build Locally First

Before deploying, run the Vercel build locally to catch any errors:

```bash
# Install Vercel build deps if not done
npm install -g vercel

# Pull env vars from Vercel (so local build uses real values)
vercel env pull .env.vercel

# Build everything (same command Vercel runs)
BASE_PATH=/ pnpm --filter @workspace/api-server run build && \
BASE_PATH=/ pnpm --filter @workspace/app run build
```

If the build succeeds, you'll see:
- `artifacts/api-server/dist/index.mjs` — API server (for Replit)
- `artifacts/api-server/dist/app.mjs` — API handler (for Vercel serverless)
- `artifacts/api-server/dist/poh.js` — Browser SDK bundle
- `artifacts/app/dist/public/` — React SPA static files

---

## Step 6 — Deploy to Production

```bash
vercel --prod
```

Vercel will:
1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Build the API server (esbuild → `dist/app.mjs`)
3. Build the Vite frontend (`dist/public/`)
4. Deploy static files to the CDN
5. Deploy the Express serverless function

When complete, you'll get a URL like `https://poh-xyz.vercel.app`.

**After your first deploy**, go back and update `APP_URL`:
```bash
vercel env rm APP_URL production
vercel env add APP_URL production
# Enter: https://poh-xyz.vercel.app
```

Then redeploy to pick up the new value:
```bash
vercel --prod
```

---

## Step 7 — Verify the Deployment

### Check the frontend loads
Open `https://your-app.vercel.app` — you should see the PoH marketing site with the "Initializing Trust Protocol" preloader.

### Check the API is live
```bash
curl https://your-app.vercel.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Check login works
```bash
curl -s -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@poh.io","password":"PohDemo2026!"}' \
  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.token ? '✓ Login OK' : '✗ Login failed: ' + JSON.stringify(d))"
```

### Check dashboard data
```bash
TOKEN="your-token-from-above"
curl -H "Authorization: Bearer $TOKEN" \
  "https://your-app.vercel.app/api/overview?days=7"
```

---

## Troubleshooting

### Build fails with "PORT environment variable is required"
The Vite config was updated to only require `PORT` in dev mode. If you still see this error, make sure you have the latest `artifacts/app/vite.config.ts` — the fix conditionally checks `command === "build"`.

### "Cannot find module geoip-lite"
`geoip-lite` loads geographic IP data from disk. On Vercel, it is included via `vercel.json`'s `includeFiles`. If lookups return `null` instead of failing, that's normal — Vercel's edge network provides geo data via request headers (`x-vercel-ip-country`, `x-vercel-ip-city`). A future enhancement can read those headers instead of calling `geoip.lookup()`.

### "DATABASE_URL must be set"
The `DATABASE_URL` env var was not set in Vercel before deploying. Go to **Vercel Dashboard → Settings → Environment Variables** and add it, then redeploy with `vercel --prod`.

### Functions timing out (504 errors)
The serverless function has `maxDuration: 30` seconds. If you're hitting this, the most common cause is a slow DB query. Check Neon's query insights dashboard for slow queries. You can raise `maxDuration` up to 300 on Pro plans.

### Geo lookups always return null
Vercel's serverless functions run in a sandboxed environment where the `geoip-lite` binary database files may not load correctly. To use Vercel's native geo data instead, update `artifacts/api-server/src/routes/dashboard.ts` to read from `req.headers['x-vercel-ip-country']` and `req.headers['x-vercel-ip-city']` when `geoip.lookup()` returns null.

---

## Keeping Replit Working Too

The changes made for Vercel are backward-compatible with Replit:
- `vite.config.ts` still reads `PORT` and `BASE_PATH` in dev mode (set by Replit)
- The Replit-specific plugins still load when `REPL_ID` is set
- `artifacts/api-server` still starts normally with `pnpm --filter @workspace/api-server run dev`
- The `dist/app.mjs` Vercel entry is an additional build output — it doesn't affect `dist/index.mjs`

No Replit workflows or environment variables need to change.

---

## Custom Domain (optional)

After deploying, go to **Vercel Dashboard → your project → Settings → Domains** and add your custom domain. Vercel handles TLS automatically.

For the MCP server to point at the custom domain:
```bash
# Update POH_API_URL in your Claude/Cursor/Windsurf MCP config:
POH_API_URL=https://your-domain.com/api
```

---

## Environment Variable Quick Reference

| Variable | Required | Example Value | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | `postgresql://...` | Neon/Supabase connection string |
| `JWT_SECRET` | ✅ Yes | 64-char hex | Signs authentication tokens |
| `NODE_ENV` | ✅ Yes | `production` | Disables dev-only features |
| `APP_URL` | ⚠️ Recommended | `https://poh.vercel.app` | Password-reset email links |
| `PORT` | ❌ Not needed | — | Replit dev only |
| `BASE_PATH` | ❌ Not needed | — | Replit dev only |
| `REPLIT_DOMAINS` | ❌ Not needed | — | Replit only (graceful fallback exists) |
