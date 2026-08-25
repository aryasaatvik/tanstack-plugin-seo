/**
 * JSON-LD structured-data generators.
 *
 * schema.org payloads typed against `schema-dts`, which is a types-only devDep —
 * it erases at build, so this module keeps the entry's zero-runtime-dep rule.
 * The brand values (name, logo, sameAs, the Organization description) are the
 * host's, and arrive through {@link SeoConfig}; the schema construction is ours.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 * @see https://schema.org/
 */

import type {
  Article,
  BreadcrumbList,
  FAQPage,
  ItemList,
  Organization,
  Person,
  Question,
  Service,
  WebSite,
  WithContext,
} from "schema-dts";

import { absoluteUrl, type SeoConfig } from "./site";

export interface ServiceParams {
  name: string;
  description: string;
  serviceType: string;
  provider?: string | undefined;
  areaServed?: string | undefined;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string | undefined;
  isHighlighted?: boolean | undefined;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ItemListEntry {
  name: string;
  url: string;
}

export interface ArticleParams {
  headline: string;
  description: string;
  image?: string | undefined;
  datePublished: string;
  dateModified?: string | undefined;
  author: {
    name: string;
    url?: string | undefined;
  };
  url: string;
}

/** The JSON-LD generators, bound to one site identity. */
export interface JsonLd {
  /** Brand entity for the Knowledge Graph. Render site-wide (root layout). */
  generateOrganizationSchema: () => WithContext<Organization>;
  /** WebSite entity with a sitelinks search box. Render on the homepage. */
  generateWebsiteSchema: () => WithContext<WebSite>;
  generateServiceSchema: (params: ServiceParams) => WithContext<Service>;
  generateFAQPageSchema: (faqs: FAQItem[]) => WithContext<FAQPage>;
  generateBreadcrumbSchema: (items: BreadcrumbItem[]) => WithContext<BreadcrumbList>;
  /** Describe a visibly rendered, ordered collection of canonical pages. */
  generateItemListSchema: (
    name: string,
    items: ReadonlyArray<ItemListEntry>,
  ) => WithContext<ItemList>;
  generateArticleSchema: (params: ArticleParams) => WithContext<Article>;
}

export function createJsonLd(config: SeoConfig): JsonLd {
  const { origin, site, organization, website } = config;

  return {
    generateOrganizationSchema: () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      ...(organization.legalName === undefined ? {} : { legalName: organization.legalName }),
      url: origin,
      logo: absoluteUrl(origin, site.logo),
      description: organization.description,
      sameAs: [...organization.sameAs],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: organization.contactPoint.contactType,
        email: organization.contactPoint.email,
      },
      ...(organization.address === undefined
        ? {}
        : {
            address: {
              "@type": "PostalAddress" as const,
              ...organization.address,
            },
          }),
    }),

    generateWebsiteSchema: () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: absoluteUrl(origin, website.searchPath),
        },
        query: "required name=search_term_string",
      },
    }),

    generateServiceSchema: (params) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: params.name,
      description: params.description,
      serviceType: params.serviceType,
      provider: {
        "@type": "Organization",
        name: params.provider ?? site.name,
        url: origin,
      },
      areaServed: params.areaServed ?? "Worldwide",
    }),

    generateFAQPageSchema: (faqs) => {
      const questions: Question[] = faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      }));

      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions,
      };
    },

    generateBreadcrumbSchema: (items) => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${origin}${item.url}`,
      })),
    }),

    generateItemListSchema: (name, items) => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: `${origin}${item.url}`,
      })),
    }),

    generateArticleSchema: (params) => {
      const authorSchema: Person = {
        "@type": "Person",
        name: params.author.name,
        ...(params.author.url && { url: params.author.url }),
      };

      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: params.headline,
        description: params.description,
        // Deliberately NOT absolutized: a declared instance image lands verbatim
        // (og:image is where the absolute form is required, and seoHead does that).
        image: params.image ?? absoluteUrl(origin, site.defaultImage),
        datePublished: params.datePublished,
        dateModified: params.dateModified ?? params.datePublished,
        author: authorSchema,
        publisher: {
          "@type": "Organization",
          name: site.name,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl(origin, site.publisherLogo),
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": params.url,
        },
      };
    },
  };
}
