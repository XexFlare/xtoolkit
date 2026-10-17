import { describe, expect, it } from "vitest";
import {
  CONSENT_KEY,
  parseConsent,
  readConsent,
  resetConsent,
  toConsentModeV2,
  writeConsent,
} from "../src";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("consent", () => {
  it("defaults to undecided and denied", () => {
    expect(readConsent(memoryStorage())).toEqual({ decided: false, analytics: false, ads: false });
  });

  it("round-trips a choice", () => {
    const storage = memoryStorage();
    writeConsent({ analytics: true, ads: false }, storage);
    expect(readConsent(storage)).toEqual({ decided: true, analytics: true, ads: false });
  });

  it("ignores corrupt stored values", () => {
    expect(parseConsent("{not json")).toEqual({ decided: false, analytics: false, ads: false });
    expect(parseConsent('{"decided":"yes","analytics":1}')).toEqual({
      decided: false,
      analytics: false,
      ads: false,
    });
  });

  it("reset reopens the banner", () => {
    const storage = memoryStorage();
    writeConsent({ analytics: true, ads: true }, storage);
    resetConsent(storage);
    expect(JSON.parse(storage.getItem(CONSENT_KEY)!).decided).toBe(false);
  });

  it("maps to Consent Mode v2 signals", () => {
    expect(toConsentModeV2({ decided: true, analytics: true, ads: false })).toEqual({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });
});
