## tanstack-plugin-seo@0.2.0

### Add Content-Signal to robots.txt

`renderRobots` now takes `contentSignal` (the preference list), extra `directives`, and a `transform` for a last-mile override. The same fields live on `seo.config.ts` so `seo robots` prints the same file as the route. Preview hosts still omit the origin-wide group lines. No default signal.

## tanstack-plugin-seo@0.1.0

### Initial release

Route-declared SEO for TanStack Router: declare once on the route, then derive
the sitemap, robots.txt, breadcrumbs, JSON-LD, cross-link graph, Vite coverage
gate, and CLI from that graph.
