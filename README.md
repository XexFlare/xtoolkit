# xtoolkit

Shared code for the calculatorx tools. Code only, no data. Private repo on the personal GitHub account (not the AIFlare organisation).

## Packages

| Package | Purpose | Built in |
|---|---|---|
| `@xtoolkit/ui` | Layout, theme, ad slot, consent, newsletter, legal pages | C03 |
| `@xtoolkit/utils` | Units, currency, print/PDF, share links, CSV | C03 onward |
| `@xtoolkit/analytics` | GA4, Consent Mode v2, usage events | C04 |
| `@xtoolkit/clients` | Dataset and ShipRouteX API clients | C15 onward |
| `@xtoolkit/pwa` | Manifest, service worker, assetlinks | C26 |

## Use

Develop locally with `npm link`. Once stable, tools install a pinned tag, e.g. `"xtoolkit": "github:XexFlare/xtoolkit#v1.0.0"`. Private repo builds on Netlify need a fine-grained read-only token scoped to this repo, stored as a Netlify environment variable. Never commit it.

## Checks

`npm install`, then `npm run check` (typecheck and tests).

Configuration lives in environment variables; see `.env.example`.
