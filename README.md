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

## Installing in a tool

The kit is a private git dependency pinned to a tag. Import by subpath (the kit ships TypeScript source, so the tool's bundler compiles it):

```json
"dependencies": { "xtoolkit": "git+https://github.com/XexFlare/xtoolkit.git#v0.2.0" }
```

```ts
import { ThemeToggle } from "xtoolkit/ui";
import "xtoolkit/ui/styles.css";
import { createTracker } from "xtoolkit/analytics";
import { handleEventRequest } from "xtoolkit/analytics/server";
```

Subpaths: `ui`, `ui/styles.css`, `analytics`, `analytics/server`, `utils`, `clients`, `pwa`. Inside the kit, packages import each other by relative path so this works from a plain install.

To release a change: commit, bump `version`, `git tag vX.Y.Z`, push with tags, then bump the tag in each tool and run `npm install`.

### Netlify access to the private repo

Create a fine-grained GitHub token with read-only "Contents" access to `XexFlare/xtoolkit` only. Add three Netlify environment variables (git reads them before `npm install` runs, so the token never enters the repo):

```
GIT_CONFIG_COUNT=1
GIT_CONFIG_KEY_0=url.https://<TOKEN>@github.com/.insteadOf
GIT_CONFIG_VALUE_0=https://github.com/
```

Locally, your normal GitHub login is used.
