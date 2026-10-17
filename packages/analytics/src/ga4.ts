import { onConsentChange, readConsent, toConsentModeV2, type ConsentState } from "./consent";
import { KEY_EVENTS, type EventName, type EventParams } from "./events";

type Gtag = (...args: unknown[]) => void;

const PLACEHOLDER = /X{4,}/;

export function isGaConfigured(measurementId: string | undefined): measurementId is string {
  return Boolean(measurementId && /^G-[A-Z0-9]+$/.test(measurementId) && !PLACEHOLDER.test(measurementId));
}

export function isKeyEvent(name: EventName): boolean {
  return KEY_EVENTS.includes(name);
}

let ready = false;

/**
 * Loads GA4 with Consent Mode v2. Consent defaults to denied before the config
 * call, so until a visitor accepts, GA only receives cookieless pings.
 * Does nothing while the measurement ID is the .env.example placeholder.
 */
export function initGa4(measurementId: string | undefined, platform: Window = window): boolean {
  if (!isGaConfigured(measurementId) || ready) return ready;
  const w = platform as unknown as { dataLayer?: unknown[]; gtag?: Gtag };
  const dataLayer: unknown[] = (w.dataLayer = w.dataLayer || []);
  // GA reads dataLayer entries as `arguments` objects, so this must not use rest args.
  const gtag = (w.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  } as Gtag);

  gtag("consent", "default", { ...toConsentModeV2(readConsent()), wait_for_update: 500 });
  gtag("js", new Date());
  gtag("config", measurementId, { anonymize_ip: true });

  const script = platform.document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  platform.document.head.appendChild(script);

  onConsentChange((state: ConsentState) => gtag("consent", "update", toConsentModeV2(state)));
  ready = true;
  return true;
}

export function ga4Event(name: EventName, params: EventParams, platform: Window = window): void {
  if (!ready) return;
  const gtag = (platform as unknown as { gtag?: Gtag }).gtag;
  gtag?.("event", name, params);
}
