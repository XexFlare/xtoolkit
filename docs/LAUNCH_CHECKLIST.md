# Launch checklist

Filled in during C03 to C05. Each tool must pass before going live.

- [ ] Typecheck, lint, tests and production build pass
- [ ] GA4 Measurement ID, ad client and slot set from environment variables
- [ ] Consent banner works (Consent Mode v2)
- [ ] Legal pages present (privacy, terms, cookies)
- [ ] Data credits line shown where a dataset is used
- [ ] Netlify site deployed with the read-only xtoolkit token set through the `GIT_CONFIG_*` variables (README)

## Usage log and analytics (C04)

Per tool, once the accounts exist:

1. Copy `templates/netlify/*.mts` to the tool's `netlify/functions/` and import from `xtoolkit/analytics/server` (the installed kit; see the README).
2. Netlify environment variables: `FIREBASE_SERVICE_ACCOUNT` (service account JSON), `STATS_TOKEN` (long random string), `USAGE_TOOLS` (comma separated tool ids), plus the build variable `VITE_GA_MEASUREMENT_ID` (GA4).
3. Firestore: enable a TTL policy on collection `usage_events`, field `expireAt` (90 day expiry).
4. Dashboard: `templates/netlify/dashboard.html` served at `/stats/` (noindex). It asks for `STATS_TOKEN` and calls `/api/stats`.
5. GA4: mark `tool_calculate` and `newsletter_signup` as key events; add the Search Console DNS record for `calculatorx.site`.
