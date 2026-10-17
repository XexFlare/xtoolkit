/** The standard usage events shared by every tool (plan section 7.1). */
export const EVENT_NAMES = [
  "tool_calculate",
  "tool_input_error",
  "result_export",
  "result_share",
  "newsletter_signup",
  "related_tool_click",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/** GA4 key events (conversions). */
export const KEY_EVENTS: readonly EventName[] = ["tool_calculate", "newsletter_signup"];

export type EventParams = Record<string, string | number | boolean>;

export type Source = "web" | "play";

export type UsageEvent = {
  tool: string;
  event: EventName;
  params: EventParams;
  source: Source;
};

const TOOL_PATTERN = /^[a-z0-9-]{1,32}$/;
const KEY_PATTERN = /^[a-z][a-z0-9_]{0,23}$/;
const MAX_PARAMS = 8;
const MAX_VALUE_LENGTH = 40;
const EMAIL_LIKE = /\S+@\S+/;

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && (EVENT_NAMES as readonly string[]).includes(value);
}

export function isToolId(value: unknown): value is string {
  return typeof value === "string" && TOOL_PATTERN.test(value);
}

/**
 * Keeps only small, non-personal parameters. Anything that looks like an email,
 * is too long, or is not a primitive is dropped rather than stored.
 */
export function sanitizeParams(input: unknown): EventParams {
  const out: EventParams = {};
  if (typeof input !== "object" || input === null || Array.isArray(input)) return out;
  for (const [key, value] of Object.entries(input)) {
    if (Object.keys(out).length >= MAX_PARAMS) break;
    if (!KEY_PATTERN.test(key)) continue;
    if (typeof value === "boolean") out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "string" && value.length <= MAX_VALUE_LENGTH && !EMAIL_LIKE.test(value)) {
      out[key] = value;
    }
  }
  return out;
}

export function parseUsageEvent(body: unknown): UsageEvent | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;
  if (!isToolId(raw.tool)) return null;
  if (!isEventName(raw.event)) return null;
  return {
    tool: raw.tool,
    event: raw.event,
    params: sanitizeParams(raw.params),
    source: raw.source === "play" ? "play" : "web",
  };
}

/** `?source=play` on the start URL marks Play suite traffic. */
export function detectSource(search: string): Source {
  return new URLSearchParams(search).get("source") === "play" ? "play" : "web";
}
