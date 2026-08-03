import type { AnyRouteMatch } from "@tanstack/react-router";
import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";

export interface CrumbTrailItem {
  name: string;
  path: string;
}

/**
 * Walk the match chain in order, keeping matches that declare `staticData.seo.crumb`,
 * resolving string | fn form. Shared by <Breadcrumbs/> and seoHead's BreadcrumbList.
 */
export function resolveCrumbTrail(matches: ReadonlyArray<AnyRouteMatch>): Array<CrumbTrailItem> {
  const trail: Array<CrumbTrailItem> = [];
  for (const match of matches) {
    const crumb = match.staticData.seo?.crumb;
    if (crumb === undefined) continue;
    const name = typeof crumb === "function" ? crumb(match) : crumb;
    trail.push({ name, path: match.pathname });
  }
  return trail;
}

export function Breadcrumbs({ className }: { className?: string | undefined }) {
  const trail = resolveCrumbTrail(useMatches());
  if (trail.length < 2) return null;

  const lastIndex = trail.length - 1;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="text-muted-foreground flex items-center gap-2 font-mono text-[11px] tracking-wide uppercase">
        {trail.map((item, index) => {
          const isLast = index === lastIndex;
          return (
            <Fragment key={item.path}>
              {index > 0 ? (
                <li aria-hidden="true" className="text-muted-foreground/50">
                  /
                </li>
              ) : null}
              <li
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "text-foreground truncate" : undefined}
              >
                {isLast ? (
                  item.name
                ) : (
                  <Link to={item.path} className="hover:text-foreground transition-colors">
                    {item.name}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
