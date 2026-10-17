export type FaqItem = { question: string; answer: string };

/** schema.org FAQPage markup for search engines. */
export function faqJsonLd(items: FaqItem[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}
