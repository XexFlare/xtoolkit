export type NewsletterResult = { ok: true } | { ok: false; error: string };

export type NewsletterSignup = {
  email: string;
  /** Tool the visitor signed up from, e.g. "sscc". */
  tool: string;
};

/** Every provider (Buttondown, MailerLite, Brevo...) is wrapped in this one interface. */
export interface NewsletterAdapter {
  subscribe(signup: NewsletterSignup): Promise<NewsletterResult>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value.trim());
}

/**
 * Posts `{ email, tool }` as JSON to an endpoint you control (a Netlify Function
 * or a provider's form action). Swapping providers means changing this one URL.
 */
export function endpointAdapter(
  url: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): NewsletterAdapter {
  return {
    async subscribe(signup) {
      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: signup.email.trim(), tool: signup.tool }),
        });
        if (!response.ok) return { ok: false, error: "The signup service refused the request. Please try again later." };
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the signup service. Check your connection and try again." };
      }
    },
  };
}

/**
 * Chooses an adapter from config. `none` returns null so the UI hides the form
 * entirely instead of showing a signup that goes nowhere.
 */
export function createNewsletterAdapter(
  provider: string | undefined,
  endpoint: string | undefined,
  fetchImpl?: typeof fetch,
): NewsletterAdapter | null {
  if (!provider || provider === "none") return null;
  if (!endpoint) return null;
  return endpointAdapter(endpoint, fetchImpl);
}
