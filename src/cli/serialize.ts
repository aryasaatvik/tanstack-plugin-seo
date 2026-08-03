/**
 * A stable, JSON-safe projection of the {@link SeoGraph} for the `--json` /
 * `--format json` data plane. The live graph keys nodes by a `Map` (not JSON) and
 * a route policy's `crumb` may be a function (also not JSON) — this flattens the
 * `Map` to a sorted array and renders a function crumb as the sentinel
 * `"(dynamic)"` so the payload is deterministic and diffable across runs.
 */

import type { RouteSeo } from "../core/declare";
import type { SeoGraph, SeoNode } from "../core/graph";

interface SerializedPolicy {
  kind: RouteSeo["kind"];
  crumb?: string | undefined;
  sitemap?: RouteSeo["sitemap"] | undefined;
  robots?: string | undefined;
  related?: ReadonlyArray<string> | undefined;
  link?: RouteSeo["link"] | undefined;
  redirectTo?: string | undefined;
}

export interface SerializedNode {
  path: string;
  kind: SeoNode["kind"];
  source: SeoNode["source"];
  policy: SerializedPolicy;
  instance?: SeoNode["instance"] | undefined;
}

export interface SerializedGraph {
  nodes: Array<SerializedNode>;
  edges: SeoGraph["edges"];
}

const serializeCrumb = (crumb: RouteSeo["crumb"]): string | undefined => {
  if (crumb === undefined) return undefined;
  return typeof crumb === "function" ? "(dynamic)" : crumb;
};

/** JSON-safe projection of one node (route policy `crumb` functions → sentinel). */
export const serializeNode = (node: SeoNode): SerializedNode => ({
  path: node.path,
  kind: node.kind,
  source: node.source,
  policy: {
    kind: node.policy.kind,
    crumb: serializeCrumb(node.policy.crumb),
    sitemap: node.policy.sitemap,
    robots: node.policy.robots,
    related: node.policy.related,
    link: node.policy.link,
    redirectTo: node.policy.redirectTo,
  },
  instance: node.instance,
});

/** Flatten the graph to a sorted, JSON-safe shape. Nodes are ordered by path. */
export const serializeGraph = (graph: SeoGraph): SerializedGraph => ({
  nodes: [...graph.nodes.values()]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map(serializeNode),
  edges: graph.edges,
});
