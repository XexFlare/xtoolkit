import { detectSource, sanitizeParams, type EventName, type EventParams, type Source } from "./events";
import { ga4Event, initGa4 } from "./ga4";
import { DEFAULT_ENDPOINT, sendUsageEvent } from "./usageLog";

export type TrackerOptions = {
  /** Short lowercase tool id, e.g. "sscc". */
  tool: string;
  /** GA4 measurement ID; placeholders are ignored. */
  gaMeasurementId?: string;
  endpoint?: string;
  /** Set false to skip the own usage log (for example in tests). */
  usageLog?: boolean;
};

export type Tracker = {
  track: (event: EventName, params?: EventParams) => void;
  source: Source;
};

/** One call per tool at start-up. `track` then fans each event out to GA4 and the own log. */
export function createTracker(options: TrackerOptions): Tracker {
  const source = typeof location === "undefined" ? "web" : detectSource(location.search);
  initGa4(options.gaMeasurementId);

  return {
    source,
    track(event, params = {}) {
      const clean = sanitizeParams(params);
      ga4Event(event, { tool: options.tool, source, ...clean });
      if (options.usageLog !== false) {
        sendUsageEvent({ tool: options.tool, event, params: clean, source }, options.endpoint ?? DEFAULT_ENDPOINT);
      }
    },
  };
}
