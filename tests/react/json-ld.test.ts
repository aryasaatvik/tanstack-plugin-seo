import { describe, expect, it } from "vitest";

import { createSeo } from "../../src/react/create-seo";

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
