import { defineConfig } from "tsdown";

// One entry per public `exports` subpath, plus `cli` for the `bin`. The core is
// pure data + string rendering — no React, no Node builtins — so `neutral` keeps
// it usable from a Worker, a browser bundle, and a CLI alike. `react` reaches the
// browser bundle too; `vite`, `config`, and `cli` are Node-only, and their node:
// imports stay external.
//
// `cli` is the only entry that reaches Effect, and it reaches it through a
// dynamic import in `bin.ts` so a missing optional peer can be reported instead
// of thrown. Rolldown keeps a dynamic import in its own chunk, which is what
// preserves that guard.
export default defineConfig({
  entry: {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    vite: "src/vite/index.ts",
    config: "src/config/index.ts",
    cli: "src/cli/bin.ts",
  },
  format: ["esm"],
  outDir: "dist",
  dts: true,
  sourcemap: true,
  clean: true,
  platform: "neutral",
  // Neutral resolves no Node builtins, so the `vite` entry's `node:*` imports
  // are declared external here rather than left to be inferred with a warning.
  // `schema-dts` is types-only: it is bundled into the `.d.ts` and erases from
  // the JS, which is what keeps `.`/`./react` free of runtime dependencies.
  deps: { neverBundle: [/^node:/] },
  // Emit `.js` (not `.mjs`) so the `exports` map points at plain `.js`; the
  // package is `type: module`, so `.js` is ESM.
  outExtensions: () => ({ js: ".js" }),
});
