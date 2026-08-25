import { describe, expect, it } from "vitest";

import { createSeo } from "../../src/react/create-seo";
import { defineJsonLd, jsonLdGraph, jsonLdRef } from "../../src/react/json-ld";

describe("Organization JSON-LD", () => {
  it("renders optional legal identity and mailing address", () => {
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
        legalName: "Example, Inc.",
        description: "Example description.",
        sameAs: ["https://github.com/example"],
        contactPoint: { contactType: "Customer Support", email: "support@example.com" },
        address: {
          streetAddress: "123 Example Street",
          addressLocality: "Example City",
          addressRegion: "CA",
          postalCode: "94105",
          addressCountry: "US",
        },
      },
      website: { searchPath: "/search?q={search_term_string}" },
    });

    expect(seo.generateOrganizationSchema()).toMatchObject({
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      name: "Example",
      legalName: "Example, Inc.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "123 Example Street",
        addressLocality: "Example City",
        addressRegion: "CA",
        postalCode: "94105",
        addressCountry: "US",
      },
    });
  });

  it("omits optional legal identity fields when absent", () => {
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
        contactPoint: { contactType: "Customer Support", email: "support@example.com" },
      },
      website: { searchPath: "/search?q={search_term_string}" },
    });

    const organization = seo.generateOrganizationSchema();
    expect(organization).not.toHaveProperty("legalName");
    expect(organization).not.toHaveProperty("address");
  });
});

describe("JSON-LD composition", () => {
  it("types arbitrary schema.org entities and links them in a graph", () => {
    const organization = defineJsonLd({
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      name: "Example, Inc.",
    });
    const application = defineJsonLd({
      "@type": "SoftwareApplication",
      "@id": "https://example.com/#product",
      name: "Example",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      provider: jsonLdRef("https://example.com/#organization"),
    });

    expect(jsonLdGraph([organization, application])).toEqual({
      "@context": "https://schema.org",
      "@graph": [organization, application],
    });
  });
});

describe("site identity references", () => {
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
      contactPoint: { contactType: "Customer Support", email: "support@example.com" },
    },
    website: { searchPath: "/search?q={search_term_string}" },
  });

  it("connects the website, articles, and site-provided services to one organization", () => {
    expect(seo.generateWebsiteSchema()).toMatchObject({
      "@id": "https://example.com/#website",
      publisher: { "@id": "https://example.com/#organization" },
    });
    expect(
      seo.generateServiceSchema({
        name: "Example API",
        description: "Example service.",
        serviceType: "API",
      }),
    ).toMatchObject({
      provider: {
        "@id": "https://example.com/#organization",
        name: "Example",
      },
    });
    expect(
      seo.generateArticleSchema({
        headline: "Example article",
        description: "Example article description.",
        datePublished: "2026-08-25",
        author: { name: "Example Team" },
        url: "https://example.com/blog/example",
      }),
    ).toMatchObject({
      publisher: {
        "@id": "https://example.com/#organization",
        name: "Example",
      },
    });
  });

  it("does not identify an explicitly different service provider as the site organization", () => {
    const service = seo.generateServiceSchema({
      name: "Partner service",
      description: "Provided by a partner.",
      serviceType: "Integration",
      provider: "Example Partner",
    });

    expect(service.provider).toMatchObject({ name: "Example Partner" });
    expect(service.provider).not.toHaveProperty("@id");
    expect(service.provider).not.toHaveProperty("url");
  });
});
