---
name: API lib default export
description: How to import from artifacts/app/src/lib/api.js — default vs named exports
---

The axios client in `artifacts/app/src/lib/api.js` exports:
- **Default export**: `api` (the axios instance with baseURL and withCredentials)
- **Named exports**: `fetcher`, `apiError`, `API`

**Why:** The file uses `export default api` — importing `{ api }` is a named import and will fail with "does not provide an export named 'api'".

**How to apply:** Always use `import api from "@/lib/api"` for the axios instance. If you also need fetcher: `import api, { fetcher } from "@/lib/api"`.
