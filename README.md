# emdash-plugin-cookie-consent

[![CI](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/actions/workflows/ci.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/actions/workflows/ci.yml)
[![Security](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/actions/workflows/security.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/actions/workflows/security.yml)
[![npm version](https://img.shields.io/npm/v/emdash-plugin-cookie-consent)](https://www.npmjs.com/package/emdash-plugin-cookie-consent)

A fully customizable cookie consent banner plugin for [EmDash CMS](https://emdashcms.com) with category-level opt-in, theming, and an admin settings panel.

## Features

- **4 consent categories** — Necessary (always required), Functional, Analytics, Marketing
- **Granular opt-in** — Accept All, Reject All, or custom selection via inline panel
- **Cookie persistence** — 365-day expiry with `SameSite=Lax`
- **Admin settings panel** — Full UI at `/_emdash/admin`
- **6 built-in themes** — Dark, Light, Midnight, Clean, Warm, Forest, plus custom colors
- **Mobile responsive** — Collapses to stacked layout on small screens
- **No external dependencies** — Zero runtime deps, all CSS/JS inlined (~5 KB per page)

## Prerequisites

- EmDash CMS `^0.13.0`
- Your base layout must include `<EmDashHead />` and `<EmDashBodyEnd />` — the plugin injects CSS and scripts via these hooks. Without them the banner won't render.

## Installation

```bash
npm install emdash-plugin-cookie-consent
```

## Usage

Register the plugin in `astro.config.mjs`:

```ts
import { cookieConsentPlugin } from "emdash-plugin-cookie-consent";
import emdash from "emdash/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [cookieConsentPlugin()],
      // database and storage remain unchanged
    }),
  ],
});
```

The banner appears automatically on all public pages — no per-page code required.

## How It Works

The plugin injects three fragments via the `page:fragments` hook:

1. **CSS** (`<style>` in `<head>`) — Banner and toggle styles
2. **Gate script** (`<script>` in `<head>`) — Reads `cookie_consent` cookie into `window.__ccConsent`
3. **Banner script** (`<script>` at `<body:end>`) — Shows/hides the banner, handles Accept/Reject/Customize/Save

All logic runs client-side. No server state required beyond plugin settings.

## Admin Settings

Navigate to `/_emdash/admin` → **Cookie Consent**.

| Field | Default | Description |
|---|---|---|
| Enabled | `true` | Show/hide the banner |
| Consent Message | *(customizable)* | Banner body text |
| Accept/Reject/Customize Label | *(customizable)* | Button text |
| Footer Reopen Text | `Cookie Preferences` | Floating reopen button |
| Privacy Policy URL | *(empty)* | Optional link |
| Banner Position | `bottom` | `top` or `bottom` |
| Color Theme | `dark` | Preset or `custom` |
| Background / Text / Button Color | *(per theme)* | Manual colors in custom mode |

Each category (Necessary, Functional, Analytics, Marketing) has configurable name and description fields.

## Integrating Third-Party Scripts

This plugin manages **consent preferences** — it does not block or load scripts. Use `window.__ccConsent` to gate your own scripts:

```ts
interface ConsentState {
  necessary: true;       // Always active
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}
```

### Quick example — Google Analytics 4

```html
<script is:inline>
  if (window.__ccConsent?.analytics) {
    // Load gtag.js only when analytics consented
  }
</script>
```

### Category reference

| Service | Category | Notes |
|---|---|---|
| Google Analytics 4 | `analytics` | Load gtag.js conditionally |
| Google Tag Manager | `analytics` / `marketing` | Map consent types |
| Facebook / Meta Pixel | `marketing` | Load fbevents.js conditionally |
| YouTube / Vimeo embeds | `functional` | Click-to-load or conditional iframe |
| Stripe / payment | `necessary` | Always load |

See the integration examples above for GA4, GTM, Facebook Pixel, and YouTube.

## Development

```bash
git clone https://github.com/adrianoamalfi/emdash-plugin-cookie-consent.git
cd emdash-plugin-cookie-consent
npm install
npm run typecheck
npm test
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Releases are automated via [semantic-release](https://github.com/semantic-release/semantic-release) — pushing `fix:`, `feat:`, or `BREAKING CHANGE:` commits to `main` triggers a release to npm and GitHub.

## License

MIT © Adriano Amalfi
