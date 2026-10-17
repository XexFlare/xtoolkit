export type SiteConfig = {
  /** Display name, e.g. "SSCC Calculator". */
  siteName: string;
  /** Public host, e.g. "ssccalculator.calculatorx.site". */
  domain: string;
  contactEmail: string;
  usesAnalytics: boolean;
  usesAds: boolean;
  /** True when the tool stores a usage log of anonymous events on our server. */
  usesUsageLog: boolean;
  /** True when a newsletter signup is offered. */
  usesNewsletter: boolean;
  /** Date the text was last reviewed, ISO format. */
  updated: string;
};

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocument = { title: string; updated: string; sections: LegalSection[] };

export function privacyPolicy(site: SiteConfig): LegalDocument {
  const sections: LegalSection[] = [
    {
      heading: "What this site does with your data",
      paragraphs: [
        `${site.siteName} runs its calculations in your browser. What you type into the calculator is not sent to our servers.`,
        "We do not ask you to create an account, and we do not collect your name.",
      ],
    },
  ];

  if (site.usesUsageLog) {
    sections.push({
      heading: "Anonymous usage counts",
      paragraphs: [
        "When you use a feature, such as generating a result or downloading a file, the site sends a short anonymous event to its own server. It records the tool name, the event, the date, your country (taken from the network request), your device type, and a few non-personal choices such as the option you picked.",
        "It does not record your IP address, and it sets no cookie. Events are deleted after 90 days. We use the totals to see which tools are useful.",
      ],
    });
  }

  if (site.usesAnalytics) {
    sections.push({
      heading: "Google Analytics",
      paragraphs: [
        "If you accept analytics, we use Google Analytics 4 to count visits and see which features are used. It sets cookies and sends data to Google. If you decline, Google Analytics only receives cookieless pings without a stored identifier.",
        "You can change your choice at any time with the privacy settings link in the page footer.",
      ],
    });
  }

  if (site.usesAds) {
    sections.push({
      heading: "Advertising",
      paragraphs: [
        "This site is free and may show ads from Google AdSense. If you accept advertising cookies, Google and its partners may use them to show ads relevant to you. If you decline, only non-personalised ads are shown, or none.",
        "See Google's own pages on how Google uses data from sites that use its services for details and opt-out options.",
      ],
    });
  }

  if (site.usesNewsletter) {
    sections.push({
      heading: "Newsletter",
      paragraphs: [
        "If you sign up for the newsletter, we store your email address with our email provider so we can send you updates. You can unsubscribe from any email, and ask us to delete your address at any time.",
      ],
    });
  }

  sections.push(
    {
      heading: "Stored in your browser",
      paragraphs: [
        "The site keeps a few settings in your browser's local storage, such as light or dark mode, your cookie choice, recent results and any label details you enter. They stay on your device. Clearing your browser data removes them.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [`Questions or deletion requests: ${site.contactEmail}.`],
    },
  );

  return { title: "Privacy Policy", updated: site.updated, sections };
}

export function termsOfUse(site: SiteConfig): LegalDocument {
  return {
    title: "Terms of Use",
    updated: site.updated,
    sections: [
      {
        heading: "Using the site",
        paragraphs: [
          `${site.siteName} at ${site.domain} is provided free of charge. By using it you agree to these terms.`,
        ],
      },
      {
        heading: "No guarantee of results",
        paragraphs: [
          "The tool is provided as is. We aim for correct results but cannot guarantee them. Check anything important, such as codes you print on shipping labels, with your own systems or the relevant standard before relying on it.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "To the extent the law allows, we are not liable for loss or damage that results from using the tool or from decisions you make using its output.",
        ],
      },
      {
        heading: "Trademarks and standards",
        paragraphs: [
          "GS1 and related names are trademarks of their owners. This site is not affiliated with or endorsed by them. Company prefixes must be licensed from your local GS1 member organisation.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: ["We may change the tool or these terms. The date at the top shows the last update."],
      },
      { heading: "Contact", paragraphs: [`Questions: ${site.contactEmail}.`] },
    ],
  };
}
