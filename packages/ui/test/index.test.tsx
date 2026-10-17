import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AdSlot,
  FaqBlock,
  LegalPage,
  NewsletterForm,
  PACKAGE_NAME,
  RelatedTools,
  SiteFooter,
  createNewsletterAdapter,
  endpointAdapter,
  faqJsonLd,
  isAdConfigured,
  isValidEmail,
  privacyPolicy,
  resolveTheme,
  termsOfUse,
  type SiteConfig,
} from "../src";

const site: SiteConfig = {
  siteName: "Test Calculator",
  domain: "test.calculatorx.site",
  contactEmail: "hello@example.com",
  usesAnalytics: true,
  usesAds: true,
  usesUsageLog: true,
  usesNewsletter: true,
  updated: "2026-10-17",
};

describe("@xtoolkit/ui", () => {
  it("exports its package name", () => {
    expect(PACKAGE_NAME).toBe("@xtoolkit/ui");
  });

  it("resolves the theme from storage, then system preference, default dark", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("bogus", null)).toBe("dark");
  });

  it("validates email addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });

  it("hides the newsletter when no provider is configured", () => {
    expect(createNewsletterAdapter("none", "https://x")).toBeNull();
    expect(createNewsletterAdapter("buttondown", undefined)).toBeNull();
    expect(createNewsletterAdapter("buttondown", "/api/subscribe")).not.toBeNull();
    expect(renderToStaticMarkup(<NewsletterForm adapter={null} tool="t" />)).toBe("");
  });

  it("posts signups to the endpoint and reports failures", async () => {
    const ok = vi.fn().mockResolvedValue({ ok: true });
    await expect(endpointAdapter("/api/subscribe", ok).subscribe({ email: " a@b.co ", tool: "sscc" })).resolves.toEqual({ ok: true });
    expect(JSON.parse(ok.mock.calls[0][1].body)).toEqual({ email: "a@b.co", tool: "sscc" });

    const bad = vi.fn().mockResolvedValue({ ok: false });
    expect((await endpointAdapter("/x", bad).subscribe({ email: "a@b.co", tool: "t" })).ok).toBe(false);
    const down = vi.fn().mockRejectedValue(new Error("offline"));
    expect((await endpointAdapter("/x", down).subscribe({ email: "a@b.co", tool: "t" })).ok).toBe(false);
  });

  it("treats env placeholders as an unconfigured ad slot", () => {
    expect(isAdConfigured("ca-pub-XXXXXXXXXXXXXXXX", "0000000000")).toBe(false);
    expect(isAdConfigured(undefined, undefined)).toBe(false);
    expect(isAdConfigured("ca-pub-1234567890123456", "9876543210")).toBe(true);
    expect(renderToStaticMarkup(<AdSlot client="ca-pub-XXXXXXXXXXXXXXXX" slot="0000000000" />)).toBe("");
  });

  it("builds FAQ JSON-LD and markup", () => {
    const items = [{ question: "What?", answer: "This." }];
    expect(JSON.parse(faqJsonLd(items)).mainEntity[0].name).toBe("What?");
    expect(renderToStaticMarkup(<FaqBlock items={items} />)).toContain("What?");
  });

  it("renders related tools and footer credits", () => {
    const html = renderToStaticMarkup(
      <>
        <RelatedTools tools={[{ name: "Container Load", description: "Fit cargo", href: "https://x" }]} />
        <SiteFooter siteName="Test" credits={[{ label: "ShipPortX", href: "https://shipportx.example" }]} />
      </>,
    );
    expect(html).toContain("Container Load");
    expect(html).toContain("Privacy settings");
    expect(html).toContain("ShipPortX");
  });

  it("generates legal text that matches the site features and has no em dashes", () => {
    const privacy = privacyPolicy(site);
    const headings = privacy.sections.map((s) => s.heading);
    expect(headings).toContain("Google Analytics");
    expect(headings).toContain("Advertising");
    const minimal = privacyPolicy({ ...site, usesAnalytics: false, usesAds: false, usesUsageLog: false, usesNewsletter: false });
    expect(minimal.sections.map((s) => s.heading)).not.toContain("Advertising");

    const all = JSON.stringify([privacy, termsOfUse(site)]) + renderToStaticMarkup(<LegalPage document={privacy} />);
    expect(all).not.toContain("—");
  });
});
