---
packages:
  "tanstack-plugin-seo": patch
---

### Default optional CLI switches

Treat omitted boolean switches as `false` so `seo audit` and the shared `--json` option work without requiring unrelated flags.
