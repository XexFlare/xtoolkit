# xtoolkit

Shared code for the calculatorx tools. Code only, no data. Public repo on the personal GitHub account (not the AIFlare organisation). Private platform code (usage-log server and Netlify templates) is in the separate `foundation` repo.

## Packages

| Package | Purpose | Built in |
|---|---|---|
| `@xtoolkit/ui` | Layout, theme, ad slot, consent, newsletter, legal pages | C03 |
| `@xtoolkit/utils` | Units, currency, print/PDF, share links, CSV | C03 onward |
| `@xtoolkit/analytics` | GA4, Consent Mode v2, usage events | C04 |
| `@xtoolkit/clients` | Dataset and ShipRouteX API clients | C15 onward |
| `@xtoolkit/pwa` | Manifest, service worker, assetlinks | C26 |

## Use

Develop locally with `npm link`. Once stable, tools install a pinned tag, e.g. `"xtoolkit": "github:XexFlare/xtoolkit#v1.0.0"`. The repo is public, so Netlify installs it with no token.

## Checks

`npm install`, then `npm run check` (typecheck and tests).

Configuration lives in environment variables; see `.env.example`.

## Installing in a tool

The kit is a public git dependency pinned to a tag. Import by subpath (the kit ships TypeScript source, so the tool's bundler compiles it):

```json
"dependencies": { "xtoolkit": "git+https://github.com/XexFlare/xtoolkit.git#v0.2.0" }
```

```ts
import { ThemeToggle } from "xtoolkit/ui";
import "xtoolkit/ui/styles.css";
import { createTracker } from "xtoolkit/analytics";
```

Subpaths: `ui`, `ui/styles.css`, `analytics`, `utils`, `clients`, `pwa`. Inside the kit, packages import each other by relative path so this works from a plain install.

To release a change: commit, bump `version`, `git tag vX.Y.Z`, push with tags, then bump the tag in each tool and run `npm install`.

The server side of the usage log (event intake, roll-up, stats) and the Netlify function templates are in the private `foundation` repo; tools install it as a second git dependency (see its README).
