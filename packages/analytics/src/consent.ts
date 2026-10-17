export type ConsentState = {
  /** True once the visitor has pressed Accept or Decline. */
  decided: boolean;
  analytics: boolean;
  ads: boolean;
};

export const CONSENT_KEY = "xtoolkit.consent.v1";

export const DEFAULT_CONSENT: ConsentState = { decided: false, analytics: false, ads: false };

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function safeStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function parseConsent(raw: string | null): ConsentState {
  if (!raw) return { ...DEFAULT_CONSENT };
  try {
    const value = JSON.parse(raw) as Partial<ConsentState>;
    return {
      decided: value.decided === true,
      analytics: value.analytics === true,
      ads: value.ads === true,
    };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function readConsent(storage: StorageLike | null = safeStorage()): ConsentState {
  if (!storage) return { ...DEFAULT_CONSENT };
  try {
    return parseConsent(storage.getItem(CONSENT_KEY));
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

const listeners = new Set<(state: ConsentState) => void>();

export function writeConsent(
  choice: { analytics: boolean; ads: boolean },
  storage: StorageLike | null = safeStorage(),
): ConsentState {
  const state: ConsentState = { decided: true, analytics: choice.analytics, ads: choice.ads };
  try {
    storage?.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  listeners.forEach((listener) => listener(state));
  return state;
}

/** Reopens the banner (used by the footer "Privacy settings" link). */
export function resetConsent(storage: StorageLike | null = safeStorage()): ConsentState {
  try {
    storage?.setItem(CONSENT_KEY, JSON.stringify(DEFAULT_CONSENT));
  } catch {
    // Storage blocked: nothing persisted to reset.
  }
  const state = { ...DEFAULT_CONSENT };
  listeners.forEach((listener) => listener(state));
  return state;
}

export function onConsentChange(listener: (state: ConsentState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Consent Mode v2 signal names, mapped from our two switches. */
export function toConsentModeV2(state: ConsentState) {
  const analytics = state.analytics ? "granted" : "denied";
  const ads = state.ads ? "granted" : "denied";
  return {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  } as const;
}
