/**
 * Projections of the SEO graph: sitemap.xml, robots.txt, and single-node
 * inspection. Pure functions — the origin, the host's indexability, and the
 * robots disallow list are injected by the caller, never read from the
 * environment or a generated file.
 */

import type { SeoEdge, SeoGraph, SeoNode } from "./graph";

export interface ProjectionConfig {
  origin: string;
  indexable: boolean;
}

export interface RobotsConfig extends ProjectionConfig {
  /** Path prefixes to disallow on an indexable host (e.g. the app-only groups). */
  disallow: ReadonlyArray<string>;
}

export interface NodeReport {
  node: SeoNode;
  inSitemap: boolean;
  incoming: Array<SeoEdge>;
  outgoing: Array<SeoEdge>;
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * A node belongs in the sitemap when it declares a positive sitemap policy, is not
 * a redirect, is not robots-noindexed, and is not a param template (a route whose
 * path still contains a `$` segment — those exist only so their instances inherit).
 */
function isSitemapEligible(node: SeoNode): boolean {
  if (node.policy.redirectTo !== undefined) return false;
  if (node.policy.robots?.includes("noindex")) return false;
  if (!node.policy.sitemap) return false; // false or absent
  if (node.path.includes("$")) return false;
  return true;
}

/** Canonical absolute URL for a node under the given origin. */
function urlForNode(origin: string, node: SeoNode): string {
  return node.path === "/" ? origin : `${origin}${node.path}`;
}

/**
 * Instance lastmod: the most recent date the page's frontmatter carries. A
 * collection whose instances carry no dates (docs, a manifest-driven gallery)
 * emits no `<lastmod>` at all.
 */
function instanceLastmod(node: SeoNode): string | undefined {
  const instance = node.instance;
  if (!instance) return undefined;
  const date = instance.modifiedAt ?? instance.publishedAt;
  return date ? new Date(date).toISOString() : undefined;
}

function renderUrlEntry(url: string, lastmod: string | undefined, node: SeoNode): string {
  const sitemap = node.policy.sitemap;
  // isSitemapEligible guarantees a positive policy before this runs.
  const { changeFrequency, priority } = sitemap as { changeFrequency: string; priority: number };
  const lines = [`  <url>`, `    <loc>${escapeXml(url)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  lines.push(
    `    <changefreq>${changeFrequency}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    `  </url>`,
  );
  return lines.join("\n");
}

/**
 * Render sitemap.xml from the graph. Structural route entries emit no `<lastmod>`
 * (a route has no publish date); content instances emit it from their frontmatter.
 * Route entries are sorted by path, then instances follow in collection order.
 * `indexable` is intentionally unused — the sitemap body is host-independent;
 * robots.txt is what gates crawling.
 */
export function renderSitemap(graph: SeoGraph, cfg: ProjectionConfig): string {
  const nodes = [...graph.nodes.values()];
  const staticNodes = nodes
    .filter((node) => node.source === "route" && isSitemapEligible(node))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const instanceNodes = nodes.filter((node) => node.source !== "route" && isSitemapEligible(node));

  const seen = new Set<string>();
  const entries: Array<string> = [];
  for (const node of [...staticNodes, ...instanceNodes]) {
    const url = urlForNode(cfg.origin, node);
    const key = url.toLowerCase().replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(renderUrlEntry(url, instanceLastmod(node), node));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
    "\n",
  )}\n</urlset>\n`;
}

/**
 * Render robots.txt. A non-indexable host (previews) gets a disallow-all
 * with no Sitemap line; an indexable host disallows exactly the prefixes the caller
 * passes. Pages that declare `robots: noindex` are intentionally NOT added as
 * Disallow entries — a Disallow would stop crawlers reaching the page to read its
 * `noindex, follow` meta, so the graph's per-node robots policy never feeds this
 * list. `graph` is unused — kept for signature parity with the other projections,
 * which callers load the graph once for and pass to each.
 */
export function renderRobots(_graph: SeoGraph, cfg: RobotsConfig): string {
  if (!cfg.indexable) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }

  const lines = ["User-agent: *", "Allow: /"];
  for (const path of cfg.disallow) lines.push(`Disallow: ${path}`);
  lines.push("");
  lines.push(`Sitemap: ${cfg.origin}/sitemap.xml`);
  lines.push(`Host: ${cfg.origin}`);
  lines.push("");
  return lines.join("\n");
}

/** Inspect a single node: its declaration, sitemap eligibility, and edges. */
export function inspectNode(graph: SeoGraph, path: string): NodeReport | undefined {
  const node = graph.nodes.get(path);
  if (!node) return undefined;
  return {
    node,
    inSitemap: isSitemapEligible(node),
    incoming: graph.edges.filter((edge) => edge.to === path),
    outgoing: graph.edges.filter((edge) => edge.from === path),
  };
}
