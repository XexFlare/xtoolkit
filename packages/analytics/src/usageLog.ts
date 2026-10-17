import type { UsageEvent } from "./events";

export const DEFAULT_ENDPOINT = "/api/event";

/**
 * Sends one anonymous event to the tool's own `/api/event`. Uses sendBeacon so the
 * request survives page navigation, with a keepalive fetch as the fallback.
 * Failures are swallowed: logging must never affect the tool.
 */
export function sendUsageEvent(event: UsageEvent, endpoint = DEFAULT_ENDPOINT): void {
  try {
    const body = JSON.stringify(event);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Offline, blocked or unsupported: ignore.
  }
}
