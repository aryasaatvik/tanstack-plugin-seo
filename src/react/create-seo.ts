/**
 * The render layer: one route's SEO declaration plus its per-instance content,
 * composed into the meta/link descriptors TanStack Router renders into <head>,
 * with the JSON-LD that page warrants.
 *
 * {@link createSeo} binds the site identity once (see `site.ts`) and returns
 * the bound API, so a route file calls `seoHead(ctx, instance)` and never sees
 * an origin or a brand name.
 */

import type { AnyRouteMatch, MetaDescriptor } from "@tanstack/react-router";

import { resolveCrumbTrail } from "./breadcrumbs";
import type { JsonLdDocument, JsonLdEntry } from "./json-ld-composition";
import { absoluteUrl, type SeoConfig } from "./site";
import { createJsonLd, type FAQItem, type JsonLd } from "./json-ld";

/** Structural subset of TanStack's head() ctx — the leaf match plus the full chain. */
export interface SeoHeadCtx {
  matches: ReadonlyArray<AnyRouteMatch>;
  match: AnyRouteMatch;
}

export interface PageSeoInstance {
  /** FULL title — no suffix is appended. */
  title: string;
  description: string;
  ogTitle?: string | undefined;
  ogDescription?: string | undefined;
  /** Instance override of the route's robots policy. */
  robots?: string | undefined;
  article?:
    | {
        publishedAt: string;
        modifiedAt?: string | undefined;
        author?: { name: string; url?: string | undefined } | undefined;
        image?: string | undefined;
        tags?: ReadonlyArray<string> | undefined;
      }
    | undefined;
  faqs?: ReadonlyArray<FAQItem> | undefined;
  service?:
    | { name: string; description?: string | undefined; serviceType: string }
    | undefined;
  /** Standalone keywords meta for non-article pages; article pages derive it from tags. */
  keywords?: ReadonlyArray<string> | undefined;
  /** Visible canonical pages rendered as an ordered collection on this page. */
  itemList?:
    | {
        name: string;
        items: ReadonlyArray<{ name: string; url: string }>;
      }
    | undefined;
  /** Additional schema.org documents for this route. */
  jsonLd?: ReadonlyArray<JsonLdDocument> | undefined;
  /**
   * Explicit canonical path (used for canonical + og:url instead of the match pathname).
   * For routes whose canonical is computed independently of the URL, e.g. a docs splat
   * that derives it from the resolved slug segments in its loader.
   */
  canonicalPath?: string | undefined;
  /**
   * Explicit breadcrumb trail for the BreadcrumbList JSON-LD, overriding the match-chain
   * trail. For routes whose hierarchy lives outside the route tree — a docs splat whose
   * ancestry is a content page tree. Each item's `path` is a URL path.
   */
  breadcrumbs?: ReadonlyArray<{ name: string; path: string }> | undefined;
}

export interface SeoHead {
  meta: NonNullable<AnyRouteMatch["meta"]>;
  links: Array<{ rel: "canonical"; href: string }>;
}

/** The render API, bound to one site identity. */
export interface Seo extends JsonLd {
  seoHead: (ctx: SeoHeadCtx, instance: PageSeoInstance) => SeoHead;
}

/** Strip a trailing slash from a pathname, keeping the root "/" intact. */
function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

export function createSeo(config: SeoConfig): Seo {
  const { origin, site } = config;
  const jsonLd = createJsonLd(config);

  const seoHead = (ctx: SeoHeadCtx, instance: PageSeoInstance): SeoHead => {
    const canonical = `${origin}${instance.canonicalPath ?? normalizePathname(ctx.match.pathname)}`;
    const resolvedOgTitle = instance.ogTitle ?? instance.title;
    const resolvedOgDescription =
      instance.ogDescription ?? instance.description;
    const routeSeo = ctx.match.staticData.seo;
    const { article } = instance;
    const jsonLdEntries: Array<JsonLdEntry> = [];

    const meta: Array<MetaDescriptor> = [
      { title: instance.title },
      { name: "description", content: instance.description },
      { property: "og:title", content: resolvedOgTitle },
      { property: "og:description", content: resolvedOgDescription },
      { property: "og:type", content: article ? "article" : "website" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: resolvedOgTitle },
      { name: "twitter:description", content: resolvedOgDescription },
    ];

    const robots = instance.robots ?? routeSeo?.robots;
    if (robots !== undefined) {
      meta.push({ name: "robots", content: robots });
    }

    if (article) {
      if (article.tags?.length) {
        meta.push({ name: "keywords", content: article.tags.join(", ") });
      }
      meta.push(
        { property: "article:published_time", content: article.publishedAt },
        {
          property: "article:modified_time",
          content: article.modifiedAt ?? article.publishedAt,
        },
      );
      if (article.image !== undefined) {
        const imageUrl = absoluteUrl(origin, article.image);
        meta.push(
          { property: "og:image", content: imageUrl },
          { name: "twitter:image", content: imageUrl },
        );
      }
    }

    if (article) {
      jsonLdEntries.push({
        kind: "article",
        source: "generated",
        document: jsonLd.generateArticleSchema({
          headline: resolvedOgTitle,
          description: instance.description,
          image: article.image,
          datePublished: article.publishedAt,
          dateModified: article.modifiedAt ?? article.publishedAt,
          author: article.author ?? site.defaultAuthor,
          url: canonical,
        }),
      });
    }

    if (!article && instance.keywords) {
      meta.push({ name: "keywords", content: instance.keywords.join(", ") });
    }

    if (instance.service) {
      jsonLdEntries.push({
        kind: "service",
        source: "generated",
        document: jsonLd.generateServiceSchema({
          name: instance.service.name,
          description: instance.service.description ?? instance.description,
          serviceType: instance.service.serviceType,
        }),
      });
    }

    if (instance.faqs) {
      jsonLdEntries.push({
        kind: "faq",
        source: "generated",
        document: jsonLd.generateFAQPageSchema([...instance.faqs]),
      });
    }

    if (instance.itemList) {
      jsonLdEntries.push({
        kind: "item-list",
        source: "generated",
        document: jsonLd.generateItemListSchema(
          instance.itemList.name,
          instance.itemList.items,
        ),
      });
    }

    // TanStack accumulates every matched route's head output. Only the current leaf
    // owns the BreadcrumbList; otherwise each parent repeats a progressively stale
    // trail alongside the leaf's canonical trail on nested pages.
    const isLeafMatch = ctx.matches.at(-1)?.id === ctx.match.id;
    const trail = isLeafMatch
      ? (instance.breadcrumbs ?? resolveCrumbTrail(ctx.matches))
      : [];
    if (trail.length >= 2) {
      jsonLdEntries.push({
        kind: "breadcrumb",
        source: "generated",
        document: jsonLd.generateBreadcrumbSchema(
          trail.map((item) => ({ name: item.name, url: item.path })),
        ),
      });
    }

    if (instance.jsonLd) {
      jsonLdEntries.push(
        ...instance.jsonLd.map(
          (document): JsonLdEntry => ({
            kind: "custom",
            source: "page",
            document,
          }),
        ),
      );
    }

    for (const document of jsonLd.composeJsonLd(jsonLdEntries, { canonical })) {
      meta.push({ "script:ld+json": document });
    }

    // React's head types (JSX.IntrinsicElements['meta']) model only <meta> attributes;
    // TanStack renders `script:ld+json` entries as JSON-LD <script> tags at runtime. The
    // installed @tanstack/react-router augments leaf head meta to those JSX attributes, so
    // the JSON-LD entries are asserted to it (same pattern as an inline root JSON-LD).
    return {
      meta: meta as NonNullable<AnyRouteMatch["meta"]>,
      links: [{ rel: "canonical", href: canonical }],
    };
  };

  return { seoHead, ...jsonLd };
}
