---
packages:
  "tanstack-plugin-seo": minor
---

### Add Content-Signal to robots.txt

`renderRobots` now takes `contentSignal` (the preference list), extra `directives`, and a `transform` for a last-mile override. The same fields live on `seo.config.ts` so `seo robots` prints the same file as the route. Preview hosts still omit the origin-wide group lines. No default signal.
