import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { rm } from "node:fs/promises";

const dir = path.dirname(fileURLToPath(import.meta.url));

await rm(path.resolve(dir, "dist"), { recursive: true, force: true });

await build({
  entryPoints: [path.resolve(dir, "src/index.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.resolve(dir, "dist/index.js"),
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire } from 'module';",
      "globalThis.require = createRequire(import.meta.url);",
    ].join("\n"),
  },
  logLevel: "info",
  external: ["fsevents"],
  define: { "process.env.NODE_ENV": '"production"' },
});

console.log("✓ poh-mcp built → dist/index.js");
