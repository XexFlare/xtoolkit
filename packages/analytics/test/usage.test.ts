import { describe, expect, it } from "vitest";
import {
  detectSource,
  isGaConfigured,
  parseUsageEvent,
  sanitizeParams,
} from "../src";
import {
  aggregateEvents,
  buildStatsReport,
  createMemoryStore,
  deviceType,
  handleEventRequest,
  handleStatsRequest,
  runRollup,
  shiftDay,
  toStoredEvent,
  type UsageStore,
} from "../src/server";

const NOW = Date.parse("2026-10-17T12:00:00Z");
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0";
const PHONE = "Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36";

function post(body: unknown, userAgent = DESKTOP) {
  return new Request("https://sscc.example/api/event", {
    method: "POST",
    headers: { "user-agent": userAgent },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

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

describe("POST /api/event", () => {
  it("stores an anonymous event with country, device and a 90 day expiry", async () => {
    const store = createMemoryStore();
    const response = await handleEventRequest(
      post({ tool: "sscc", event: "tool_calculate", params: { mode: "generate" } }, PHONE),
      store,
      { country: "mw", now: NOW },
    );
    expect(response.status).toBe(204);
    expect(store.events).toHaveLength(1);
    const [stored] = store.events;
    expect(stored).toMatchObject({ tool: "sscc", day: "2026-10-17", country: "MW", device: "mobile" });
    expect(stored.expireAt - stored.ts).toBe(90 * 86_400_000);
    expect(JSON.stringify(stored)).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
  });

  it("answers 400 to bad input and stores nothing", async () => {
    const store = createMemoryStore();
    expect((await handleEventRequest(post("not json"), store)).status).toBe(400);
    expect((await handleEventRequest(post({ tool: "sscc", event: "nope" }), store)).status).toBe(400);
    expect(store.events).toHaveLength(0);
  });

  it("ignores bots, wrong methods and oversize bodies", async () => {
    const store = createMemoryStore();
    const body = { tool: "sscc", event: "tool_calculate" };
    expect((await handleEventRequest(post(body, "Googlebot/2.1"), store)).status).toBe(204);
    expect(store.events).toHaveLength(0);
    expect((await handleEventRequest(new Request("https://x/api/event"), store)).status).toBe(405);
    expect((await handleEventRequest(post("x".repeat(3000)), store)).status).toBe(413);
  });

  it("still answers 204 when no store is configured or the write fails", async () => {
    const body = { tool: "sscc", event: "tool_calculate" };
    expect((await handleEventRequest(post(body), null)).status).toBe(204);
    const broken: UsageStore = { ...createMemoryStore(), addEvent: () => Promise.reject(new Error("down")) };
    expect((await handleEventRequest(post(body), broken)).status).toBe(204);
  });

  it("classifies devices", () => {
    expect(deviceType(DESKTOP)).toBe("desktop");
    expect(deviceType(PHONE)).toBe("mobile");
    expect(deviceType("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
  });
});

describe("daily roll-up and dashboard stats", () => {
  async function seed() {
    const store = createMemoryStore();
    const send = (params: Record<string, string>, country: string, day: number, event = "tool_calculate") =>
      handleEventRequest(post({ tool: "sscc", event, params }), store, { country, now: day });
    await send({ mode: "generate" }, "MW", NOW);
    await send({ mode: "generate" }, "KE", NOW);
    await send({ mode: "batch" }, "MW", NOW, "tool_calculate");
    await send({ format: "csv" }, "MW", NOW, "result_export");
    await send({ mode: "validate" }, "KE", NOW - 86_400_000);
    return store;
  }

  it("aggregates one day of raw events", async () => {
    const store = await seed();
    const summary = aggregateEvents("sscc", "2026-10-17", await store.eventsForDay("sscc", "2026-10-17"));
    expect(summary.total).toBe(4);
    expect(summary.events).toEqual({ tool_calculate: 3, result_export: 1 });
    expect(summary.countries).toEqual({ MW: 3, KE: 1 });
    expect(summary.inputs["tool_calculate.mode=generate"]).toBe(2);
  });

  it("is idempotent: re-running the roll-up gives the same documents", async () => {
    const store = await seed();
    await runRollup(store, ["sscc"], NOW);
    const first = JSON.stringify([...store.daily.entries()]);
    await runRollup(store, ["sscc"], NOW);
    expect(JSON.stringify([...store.daily.entries()])).toBe(first);
    expect([...store.daily.keys()].sort()).toEqual(["sscc_2026-10-16", "sscc_2026-10-17"]);
  });

  it("builds the report the dashboard shows", async () => {
    const store = await seed();
    const summaries = await runRollup(store, ["sscc"], NOW);
    const report = buildStatsReport(summaries, "2026-10-16", "2026-10-17");
    const sscc = report.tools.sscc;
    expect(sscc.total).toBe(5);
    expect(sscc.perDay).toEqual([
      { day: "2026-10-16", total: 1, calculations: 1 },
      { day: "2026-10-17", total: 4, calculations: 3 },
    ]);
    expect(sscc.countries).toEqual({ KE: 2, MW: 3 });
    expect(sscc.topInputs[0]).toEqual({ input: "tool_calculate.mode=generate", count: 2 });
  });

  it("guards /api/stats with the bearer token", async () => {
    const store = await seed();
    await runRollup(store, ["sscc"], NOW);
    const call = (headers: Record<string, string>) =>
      handleStatsRequest(new Request("https://x/api/stats?tool=sscc&days=7", { headers }), store, "secret-token", NOW);
    expect((await call({})).status).toBe(401);
    expect((await call({ authorization: "Bearer wrong" })).status).toBe(401);
    const ok = await call({ authorization: "Bearer secret-token" });
    expect(ok.status).toBe(200);
    expect((await ok.json()).tools.sscc.total).toBe(5);
    expect(
      (await handleStatsRequest(new Request("https://x/api/stats"), store, undefined, NOW)).status,
    ).toBe(401);
  });

  it("shifts days across month ends", () => {
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
    expect(toStoredEvent({ tool: "t", event: "tool_calculate", params: {}, source: "web" }, { userAgent: DESKTOP, country: null, now: NOW }).country).toBe("ZZ");
  });
});
