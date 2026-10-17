import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  onConsentChange,
  readConsent,
  resetConsent,
  writeConsent,
  type ConsentState,
} from "@xtoolkit/analytics";
import { faqJsonLd, type FaqItem } from "./faq";
import type { LegalDocument } from "./legal";
import { isValidEmail, type NewsletterAdapter } from "./newsletter";

export function useConsent(): ConsentState {
  const [state, setState] = useState<ConsentState>(() => readConsent());
  useEffect(() => onConsentChange(setState), []);
  return state;
}

export function ConsentBanner({ privacyHref = "#/privacy" }: { privacyHref?: string }) {
  const consent = useConsent();
  if (consent.decided) return null;
  return (
    <div className="xt-root xt-consent" role="dialog" aria-label="Cookie choices">
      <p>
        We use cookies for anonymous visit statistics and, on some pages, advertising. You can accept
        both or keep only what the site needs. Read the <a href={privacyHref}>privacy policy</a>.
      </p>
      <div className="xt-actions">
        <button
          type="button"
          className="xt-btn xt-btn-primary"
          onClick={() => writeConsent({ analytics: true, ads: true })}
        >
          Accept all
        </button>
        <button
          type="button"
          className="xt-btn"
          onClick={() => writeConsent({ analytics: false, ads: false })}
        >
          Essential only
        </button>
      </div>
    </div>
  );
}

const PLACEHOLDER_PATTERN = /X{4,}|^0+$/;

export function isAdConfigured(client: string | undefined, slot: string | undefined): boolean {
  return Boolean(client && slot && !PLACEHOLDER_PATTERN.test(client) && !PLACEHOLDER_PATTERN.test(slot));
}

/**
 * Reserves space and loads one AdSense unit. Renders nothing until real IDs are set
 * (the .env.example placeholders count as unset) so no empty box ever shows.
 * Personalised ads need consent; without it the unit asks for non-personalised ads.
 */
export function AdSlot({ client, slot }: { client?: string; slot?: string }) {
  const consent = useConsent();
  const ref = useRef<HTMLModElement>(null);
  const configured = isAdConfigured(client, slot);

  useEffect(() => {
    if (!configured || !consent.decided) return;
    const win = window as unknown as { adsbygoogle?: unknown[] };
    if (!document.querySelector("script[data-xt-adsense]")) {
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.xtAdsense = "1";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client!)}`;
      document.head.appendChild(script);
    }
    try {
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      // Ad blocked or script failed: the page works without it.
    }
  }, [configured, consent.decided, consent.ads, client]);

  if (!configured || !consent.decided) return null;
  return (
    <aside className="xt-root xt-ad" aria-label="Advertisement">
      <small>Advertisement</small>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-npa={consent.ads ? undefined : "1"}
      />
    </aside>
  );
}

export function NewsletterForm({
  adapter,
  tool,
  onSubscribed,
}: {
  /** From createNewsletterAdapter. When null the whole block is hidden. */
  adapter: NewsletterAdapter | null;
  tool: string;
  onSubscribed?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text?: string }>({
    kind: "idle",
  });

  if (!adapter) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (honeypot) return;
    if (!isValidEmail(email)) {
      setStatus({ kind: "error", text: "Enter a valid email address." });
      return;
    }
    setStatus({ kind: "busy" });
    const result = await adapter!.subscribe({ email, tool });
    if (result.ok) {
      setStatus({ kind: "ok", text: "Thanks. You are on the list." });
      setEmail("");
      onSubscribed?.();
    } else {
      setStatus({ kind: "error", text: result.error });
    }
  }

  return (
    <section className="xt-root xt-section" aria-labelledby="xt-news-title">
      <div className="xt-newsletter">
        <h2 id="xt-news-title">Get tool updates</h2>
        <p className="xt-muted">New calculators and improvements, a few emails a year. Unsubscribe any time.</p>
        <form onSubmit={submit} noValidate>
          <label className="xt-hp" aria-hidden="true">
            Leave empty
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
          <input
            className="xt-input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="xt-btn xt-btn-primary" type="submit" disabled={status.kind === "busy"}>
            {status.kind === "busy" ? "Sending..." : "Subscribe"}
          </button>
        </form>
        <p className="xt-status" role="status" data-kind={status.kind}>
          {status.text}
        </p>
      </div>
    </section>
  );
}

export type RelatedTool = { name: string; description: string; href: string };

export function RelatedTools({ tools, onClick }: { tools: RelatedTool[]; onClick?: (tool: RelatedTool) => void }) {
  if (tools.length === 0) return null;
  return (
    <section className="xt-root xt-section" aria-labelledby="xt-related-title">
      <h2 id="xt-related-title">More free calculators</h2>
      <ul className="xt-related">
        {tools.map((tool) => (
          <li key={tool.href}>
            <a href={tool.href} onClick={() => onClick?.(tool)}>
              {tool.name}
              <span>{tool.description}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqBlock({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <section className="xt-root xt-section xt-faq" aria-labelledby="xt-faq-title">
      <h2 id="xt-faq-title">{title}</h2>
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(items) }} />
    </section>
  );
}

export type DataCredit = { label: string; href?: string };

export function DataCredits({ credits }: { credits: DataCredit[] }) {
  if (credits.length === 0) return null;
  return (
    <p className="xt-root xt-muted">
      Data credits:{" "}
      {credits.map((credit, index) => (
        <span key={credit.label}>
          {index > 0 && "; "}
          {credit.href ? (
            <a className="xt-link" href={credit.href} rel="noopener noreferrer" target="_blank">
              {credit.label}
            </a>
          ) : (
            credit.label
          )}
        </span>
      ))}
      .
    </p>
  );
}

export function SiteFooter({
  siteName,
  credits = [],
  privacyHref = "#/privacy",
  termsHref = "#/terms",
  children,
}: {
  siteName: string;
  credits?: DataCredit[];
  privacyHref?: string;
  termsHref?: string;
  children?: ReactNode;
}) {
  return (
    <footer className="xt-root xt-footer">
      <div className="xt-footer-inner">
        {children}
        <nav aria-label="Legal">
          <a className="xt-link" href={privacyHref}>Privacy policy</a>
          <a className="xt-link" href={termsHref}>Terms of use</a>
          <button type="button" className="xt-link" onClick={() => resetConsent()}>
            Privacy settings
          </button>
        </nav>
        <DataCredits credits={credits} />
        <p className="xt-muted">&copy; {new Date().getFullYear()} {siteName}</p>
      </div>
    </footer>
  );
}

export function LegalPage({ document: doc, backHref = "#top" }: { document: LegalDocument; backHref?: string }) {
  return (
    <article className="xt-root xt-legal">
      <p>
        <a className="xt-link" href={backHref}>Back to the calculator</a>
      </p>
      <h1>{doc.title}</h1>
      <p className="xt-muted">Last updated {doc.updated}</p>
      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
