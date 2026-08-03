/**
 * `tanstack-plugin-seo/config` — the `seo` CLI's configuration surface.
 *
 * The CLI is a set of pure views over one graph, but *acquiring* that graph is
 * host knowledge: only the app knows where its graph module lives and what its
 * module needs to evaluate. So the app declares it once in a `seo.config.ts` at
 * its root, which the CLI discovers from the working directory:
 *
 * ```ts
 * // seo.config.ts
 * import { defineSeoConfig, viteGraphLoader } from "tanstack-plugin-seo/config";
 * import { routeConfig } from "./lib/route-config";
 *
 * export default defineSeoConfig({
 *   origin: "https://example.com",
 *   disallow: routeConfig.robotsExclusions,
 *   loadGraph: viteGraphLoader({ root: import.meta.dirname, entry: "/lib/seo/graph.ts" }),
 * });
 * ```
 *
 * Nothing here imports Effect. The CLI needs it (an optional peer dependency),
 * but a config file must not: it is the app's file, and the app may not be an
 * Effect app.
 */

export type { LoadedSeoGraph, SeoGraphLoader, ViteGraphLoaderOptions } from "./vite-graph-loader";
export { viteGraphLoader } from "./vite-graph-loader";

import type { SeoGraphLoader } from "./vite-graph-loader";

export interface SeoCliConfig {
  /**
   * Canonical origin the sitemap and robots projections render under, no
   * trailing slash. The `--origin` flag overrides it per invocation.
   */
  readonly origin: string;
  /**
   * Path prefixes disallowed in robots.txt. Feed it the generated
   * `routeConfig.robotsExclusions` if you run the `tanstack-plugin-seo/vite` plugin.
   */
  readonly disallow: ReadonlyArray<string>;
  /** How the CLI gets the graph. {@link viteGraphLoader} covers the Vite-app case. */
  readonly loadGraph: SeoGraphLoader;
}

/** Identity — it exists for the type inference and the editor completions. */
export const defineSeoConfig = (config: SeoCliConfig): SeoCliConfig => config;
