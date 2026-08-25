import type { AnyRouteMatch } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { createSeo, defineJsonLd } from "../../src/react";

const routeMatch = (pathname: string): AnyRouteMatch =>
  ({ id: pathname, pathname, staticData: {} }) as unknown as AnyRouteMatch;

describe("seoHead JSON-LD composition", () => {
  it("emits generated and route-defined documents in caller order", () => {
    const seo = createSeo({
      origin: "https://example.com",
      site: {
        name: "Example",
        logo: "/logo.png",
        publisherLogo: "/publisher.png",
        defaultImage: "/og.png",
        defaultAuthor: { name: "Example Team" },
      },
      organization: {
        description: "Example description.",
        sameAs: [],
        contactPoint: {
          contactType: "Customer Support",
          email: "support@example.com",
        },
      },
      website: { searchPath: "/search?q={search_term_string}" },
    });
    const match = routeMatch("/product");
    const application = defineJsonLd({
      "@type": "SoftwareApplication",
      name: "Example",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
    });

    const head = seo.seoHead(
      { match, matches: [match] },
      {
        title: "Example product",
        description:
          "A developer product with enough detail for a useful search result.",
        service: { name: "Example API", serviceType: "API" },
        jsonLd: [application],
      },
    );
    const documents = head.meta.flatMap((descriptor) =>
      descriptor && "script:ld+json" in descriptor
        ? [descriptor["script:ld+json"]]
        : [],
    );

    expect(documents).toMatchObject([
      { "@type": "Service", name: "Example API" },
      { "@type": "SoftwareApplication", name: "Example" },
    ]);
  });

  it("passes the route canonical to a zero/one/many transform", () => {
    const seenCanonicals: Array<string | undefined> = [];
    const extra = defineJsonLd({ "@type": "Offer", name: "Free tier" });
    const seo = createSeo({
      origin: "https://example.com",
      site: {
        name: "Example",
        logo: "/logo.png",
        publisherLogo: "/publisher.png",
        defaultImage: "/og.png",
        defaultAuthor: { name: "Example Team" },
      },
      organization: {
        description: "Example description.",
        sameAs: [],
        contactPoint: {
          contactType: "Customer Support",
          email: "support@example.com",
        },
      },
      website: { searchPath: "/search?q={search_term_string}" },
      jsonLd: {
        transform: (entry, context) => {
          seenCanonicals.push(context.canonical);
          if (entry.kind === "service") return [entry.document, extra];
          if (entry.kind === "custom") return false;
          return entry.document;
        },
      },
    });
    const match = routeMatch("/product/");

    const head = seo.seoHead(
      { match, matches: [match] },
      {
        title: "Example product",
        description:
          "A developer product with enough detail for a useful search result.",
        service: { name: "Example API", serviceType: "API" },
        jsonLd: [
          defineJsonLd({ "@type": "SoftwareApplication", name: "Suppressed" }),
        ],
      },
    );
    const documents = head.meta.flatMap((descriptor) =>
      descriptor && "script:ld+json" in descriptor
        ? [descriptor["script:ld+json"]]
        : [],
    );

    expect(seenCanonicals).toEqual([
      "https://example.com/product",
      "https://example.com/product",
    ]);
    expect(documents).toMatchObject([
      { "@type": "Service", name: "Example API" },
      { "@type": "Offer", name: "Free tier" },
    ]);
  });
});
