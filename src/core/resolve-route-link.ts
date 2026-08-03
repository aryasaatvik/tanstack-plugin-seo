import type { AnyRoute, AnyRouter } from "@tanstack/react-router";

import type { RouteSeo } from "./declare";

interface RouteMaps {
  routesByPath: Record<string, AnyRoute | undefined>;
  routesById: Record<string, AnyRoute>;
}

/**
 * Resolve a route's declared `seo.link` card (title + description) by its full
 * path.
 *
 * `useRouter()` returns a Router typed to this app's exact route tree, so
 * `routesByPath` is keyed by the literal `FileRouteTypes["fullPaths"]` union —
 * but callers here (declared `related` targets) hold arbitrary runtime path
 * strings, not that literal type. `routesByPath` and `routesById` are plain
 * Records on every Router instance regardless of which route tree it's
 * parameterized over, so this narrows to that structural shape once, at this
 * boundary, instead of threading an `AnyRoute` cast through every call site.
 */
export function resolveRouteLink(router: AnyRouter, path: string): RouteSeo["link"] {
  const { routesByPath, routesById } = router as unknown as RouteMaps;

  const direct = routesByPath[path];
  if (direct) return direct.options.staticData?.seo?.link;

  const byFullPath = Object.values(routesById).find((route) => route.fullPath === path);
  return byFullPath?.options.staticData?.seo?.link;
}
