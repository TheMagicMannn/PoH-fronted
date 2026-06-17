---
name: Vite JSX in .js files
description: How to configure Vite to parse JSX syntax in .js (not .jsx) source files
---

When a project has `.js` source files containing JSX (e.g. migrated from CRA), Vite needs explicit configuration to parse them. Without it, Vite throws "JSX syntax extension is not currently enabled" errors.

**Config in `vite.config.ts`:**

```ts
esbuild: {
  loader: "tsx",
  include: /src\/.*\.[jt]sx?$/,
  exclude: [],
},
optimizeDeps: {
  esbuildOptions: {
    loader: {
      ".js": "jsx",
      ".jsx": "jsx",
    },
  },
},
plugins: [
  react({ include: /\.(jsx?|tsx?)$/ }),
  // ...
],
```

**Why:** Vite's default esbuild loader for `.js` files is `"js"` (no JSX). The `esbuild.loader: "tsx"` + `include` regex makes Vite treat all `.js`/`.ts`/`.jsx`/`.tsx` in `src/` as TSX. The `optimizeDeps` loader override handles the dependency pre-bundling pass. The react plugin's `include` pattern tells `@vitejs/plugin-react` to apply Babel JSX transform to `.js` files too.

**How to apply:** Any time you're migrating a CRA/craco project to Vite where source files use `.js` extension with JSX syntax.

**Note:** Also clear `node_modules/.vite` cache after changing this config, or the old cached transforms will cause errors even after the fix.
