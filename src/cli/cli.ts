import * as Command from "effect/unstable/cli/Command";

import { checkCommand } from "./commands/check";
import { auditCommand } from "./commands/audit";
import { graphCommand } from "./commands/graph";
import { inspectCommand } from "./commands/inspect";
import { robotsCommand } from "./commands/robots";
import { sitemapCommand } from "./commands/sitemap";

/**
 * Root `seo` command. Every subcommand reads the same SEO graph that render
 * time, the sitemap/robots server routes, and the test suite read — the one the
 * app's `seo.config.ts` loader produces. Route declarations are the single
 * source of truth, and these are pure views over them.
 */
export const cli = Command.make("seo").pipe(
  Command.withDescription(
    "Audit any website and inspect TanStack SEO graphs, sitemaps, robots, cross-links, and structured data.",
  ),
  Command.withExamples([
    {
      command: "seo audit https://example.com",
      description: "Audit any deployed website",
    },
    {
      command: "seo check",
      description: "Fail (exit 1) on any structural SEO violation",
    },
    { command: "seo graph", description: "Print the SEO graph as a tree" },
    { command: "seo sitemap", description: "Render sitemap.xml" },
  ]),
  Command.withSubcommands([
    auditCommand,
    graphCommand,
    inspectCommand,
    checkCommand,
    sitemapCommand,
    robotsCommand,
  ]),
);
