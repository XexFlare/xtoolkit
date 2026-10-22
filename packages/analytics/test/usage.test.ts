import { describe, expect, it } from "vitest";
import {
  detectSource,
  isGaConfigured,
  parseUsageEvent,
  sanitizeParams,
} from "../src";

describe("event validation", () => {
  it("accepts a standard event and defaults the source to web", () => {
    expect(parseUsageEvent({ tool: "sscc", event: "tool_calculate", params: { mode: "generate" } })).toEqual({
      tool: "sscc",
      event: "tool_calculate",
      params: { mode: "generate" },
      source: "web",
    });
  });

  it("rejects unknown events and bad tool ids", () => {
    expect(parseUsageEvent({ tool: "sscc", event: "page_view" })).toBeNull();
    expect(parseUsageEvent({ tool: "SSCC Tool!", event: "tool_calculate" })).toBeNull();
    expect(parseUsageEvent(null)).toBeNull();
  });

  it("drops params that could be personal or oversized", () => {
    const clean = sanitizeParams({
      mode: "batch",
      size: 10,
      email: "someone@example.com",
      long: "x".repeat(41),
      nested: { a: 1 },
      "Bad Key": "x",
    });
    expect(clean).toEqual({ mode: "batch", size: 10 });
  });

  it("detects Play traffic from the start URL", () => {
    expect(detectSource("?source=play")).toBe("play");
    expect(detectSource("?x=1")).toBe("web");
  });

  it("ignores the GA placeholder id", () => {
    expect(isGaConfigured("G-XXXXXXXXXX")).toBe(false);
    expect(isGaConfigured(undefined)).toBe(false);
    expect(isGaConfigured("G-AB12CD34EF")).toBe(true);
  });
});
