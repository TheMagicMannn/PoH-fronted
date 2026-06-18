---
name: DB dist rebuild for project references
description: When schema changes, the lib/db dist must be rebuilt so TypeScript project references pick up new columns.
---

The api-server uses TypeScript project references (`"references": [{"path": "../../lib/db"}]`).
With `composite: true` in lib/db/tsconfig.json, TypeScript resolves `@workspace/db` types from `lib/db/dist/*.d.ts` — **not** from the source `.ts` files.

**Rule:** After any change to `lib/db/src/schema/*.ts`, run:
```
cd lib/db && npx tsc --build
```

This regenerates `lib/db/dist/schema/*.d.ts` and `lib/db/dist/index.d.ts`.

**Why:** Without this, TypeScript sees the old compiled types and reports "property does not exist" errors for all new columns — even though the source schema is correct and the DB push succeeded.

**How to apply:** Whenever you add/remove/rename columns in any schema file and then see `TS2339: Property 'X' does not exist on type '{...}'` errors in the api-server, this is the fix.
