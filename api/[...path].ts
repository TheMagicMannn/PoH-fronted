/**
 * Vercel Serverless Function — PoH Express API
 *
 * Handles all /api/* requests. The Express app is pre-built by
 * `pnpm --filter @workspace/api-server run build` before Vercel deploys.
 *
 * Vercel's @vercel/node runtime wraps the default export (an Express app)
 * automatically — no extra adapter code needed.
 */
// @ts-ignore — pre-built .mjs has no declaration file; Vercel wraps the default export automatically
export { default } from "../artifacts/api-server/dist/vercel/app.mjs";
