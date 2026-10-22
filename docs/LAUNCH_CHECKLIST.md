# Launch checklist

Filled in during C03 to C05. Each tool must pass before going live.

- [ ] Typecheck, lint, tests and production build pass
- [ ] GA4 Measurement ID, ad client and slot set from environment variables
- [ ] Consent banner works (Consent Mode v2)
- [ ] Legal pages present (privacy, terms, cookies)
- [ ] Data credits line shown where a dataset is used
- [ ] Netlify site deployed with the read-only `foundation` token set through the `GIT_CONFIG_*` variables (foundation README); xtoolkit is public and needs none

## Usage log and analytics

The per-tool setup steps (function templates, environment variables, Firestore TTL, dashboard, GA4) are in `docs/USAGE_LOG.md` of the private `foundation` repo.
