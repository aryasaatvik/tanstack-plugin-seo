/**
 * `tanstack-plugin-seo/react` — the render layer.
 *
 * Bind the site identity once with {@link createSeo} and re-export the result
 * from one app module; route files then import `seoHead` from there and pass
 * only their own content. `Breadcrumbs` needs no identity (it reads the match
 * chain), so it stays a free export.
 *
 * Zero runtime dependencies: `react` and `@tanstack/react-router` are peers,
 * and `schema-dts` is types-only.
 */

export { createSeo } from "./create-seo";
export type { PageSeoInstance, Seo, SeoHead, SeoHeadCtx } from "./create-seo";

export type {
  SeoConfig,
  SeoOrganization,
  SeoPostalAddress,
  SeoSite,
  SeoWebsite,
} from "./site";

export type {
  ArticleParams,
  BreadcrumbItem,
  FAQItem,
  ItemListEntry,
  JsonLd,
  JsonLdDocument,
  JsonLdNode,
  ServiceParams,
} from "./json-ld";
export { defineJsonLd, jsonLdGraph, jsonLdRef } from "./json-ld";

export { Breadcrumbs, resolveCrumbTrail } from "./breadcrumbs";
export type { CrumbTrailItem } from "./breadcrumbs";
