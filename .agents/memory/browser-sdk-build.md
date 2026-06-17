---
name: Browser SDK build
description: How the browser IIFE bundle (poh.js) is built and served from the API server
---

The browser SDK (`artifacts/api-server/src/browser-sdk/poh.ts`) is built as a separate esbuild step in `build.mjs` (platform: "browser", format: "iife", minify: true) and outputs to `dist/poh.js` alongside `dist/index.mjs`.

**Why:** The file uses DOM globals (`document`, `window`, `screen`, etc.) which clash with the Node.js tsconfig. It must be excluded from the main `tsconfig.json` via `"exclude": ["src/browser-sdk"]` and has its own `src/browser-sdk/tsconfig.json` with `"lib": ["ES2020", "DOM"]`.

**How to apply:** Any changes to the browser SDK require a manual `node build.mjs` (or workflow restart, which runs build as part of the dev script). The bundle is served at `GET /api/poh.js` from `src/app.ts` using `readFile` from `dist/poh.js` (same directory as `dist/index.mjs`).
