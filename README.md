# emdash-plugin-cookie-consent

A fully customizable cookie consent banner plugin for [EmDash CMS](https://emdashcms.com). Features category-level opt-in (necessary, functional, analytics, marketing), configurable theming, an admin settings panel, and privacy-policy link support.

## Features

- **4 consent categories** — Necessary (always required), Functional, Analytics, Marketing
- **Granular opt-in** — Accept All, Reject All, or custom selection via inline customization panel
- **Cookie persistence** — 365-day expiry with `SameSite=Lax`, preferences survive page navigation
- **Toggle state restoration** — Saved preferences are restored when reopening the banner
- **Admin settings panel** — Full UI at `/_emdash/admin` for labels, colors, theme, position, and category names/descriptions
- **6 built-in themes** — Dark, Light, Midnight, Clean, Warm, Forest, plus custom color mode
- **Privacy policy link** — Optional URL, opens in new tab
- **Mobile responsive** — Collapses to stacked layout on small screens
- **No external dependencies** — Zero runtime deps, all CSS/JS inlined (~5 KB per page)

## How It Works

The plugin uses the `page:fragments` hook to inject three things into every public page:

1. **CSS** (`<style>` in `<head>`) — Banner and toggle styles, fully customizable via admin settings
2. **Gate script** (`<script>` in `<head>`) — Reads the `cookie_consent` cookie on page load and stores it in `window.__ccConsent`
3. **Banner script** (`<script>` at `<body:end>`) — Shows/hides the banner based on consent state, handles Accept/Reject/Customize/Save interactions

All decisions happen client-side. No server state is required beyond the plugin settings.

## Installation

```bash
### From GitHub

```bash
npm install github:adrianoamalfi/emdash-plugin-cookie-consent
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "emdash-plugin-cookie-consent": "github:adrianoamalfi/emdash-plugin-cookie-consent"
  }
}
```

### From npm (future)

```bash
npm install emdash-plugin-cookie-consent
```

### From a local path (development)

```bash
npm install ./path/to/emdash-plugin-cookie-consent
```

This creates a symlink in `node_modules` so the bare module specifier resolves correctly.

## Usage

Register the plugin in your `astro.config.mjs`:

```ts
import node from "@astrojs/node";
import react from "@astrojs/react";
import { cookieConsentPlugin } from "emdash-plugin-cookie-consent";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: "file:./data.db" }),
      storage: local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" }),
      plugins: [cookieConsentPlugin()],
    }),
  ],
});
```

That's it. The banner appears automatically on all pages that use `EmDashHead` and `EmDashBodyEnd` in their layout (the standard EmDash setup).

## Admin Settings

Navigate to `/_emdash/admin` and open **Cookie Consent** in the sidebar.

### General

| Field | Default | Description |
|---|---|---|
| Enabled | `true` | Master toggle to show/hide the banner |
| Consent Message | `We use cookies to enhance your experience...` | Banner body text |
| Accept All Label | `Accept All` | Accept button text |
| Reject All Label | `Reject All` | Reject button text |
| Customize Label | `Customize` | Opens category customization panel |
| Footer Reopen Text | `Cookie Preferences` | Floating reopen button text |
| Privacy Policy URL | *(empty)* | Optional link to your privacy page |

### Appearance

| Field | Default | Description |
|---|---|---|
| Banner Position | `bottom` | `top` or `bottom` of viewport |
| Color Theme | `dark` | Preset or `custom` for manual colors |
| Background Color | `#1a1a2e` | Banner background |
| Text Color | `#ffffff` | Text and border color |
| Button Color | `#4f46e5` | Accept button and toggle accent |

### Categories

Each category has configurable **Name** and **Description** fields (8 fields total). The default names are:

- **Necessary** — "Required for basic site functionality. Always active." (always checked, disabled)
- **Functional** — "Enables enhanced features like video embeds and live chat."
- **Analytics** — "Helps us understand how visitors interact with the site."
- **Marketing** — "Used to deliver relevant ads and track social media engagement."

## Theming

### Preset Themes

| Theme | Background | Text | Button |
|---|---|---|---|
| Dark | `#1a1a2e` | `#ffffff` | `#4f46e5` |
| Light | `#ffffff` | `#1a1a2e` | `#2563eb` |
| Midnight | `#0f172a` | `#e2e8f0` | `#3b82f6` |
| Clean | `#f8fafc` | `#1e293b` | `#0ea5e9` |
| Warm | `#1c1917` | `#fafaf9` | `#d97706` |
| Forest | `#052e16` | `#ecfdf5` | `#16a34a` |

Select `custom` in the admin panel to set arbitrary colors.

## Cookie Behavior

- **Cookie name:** `cookie_consent`
- **Value:** URL-encoded JSON: `{"necessary":true,"functional":false,"analytics":true,"marketing":false}`
- **Expiry:** 365 days
- **Path:** `/` (site-wide)
- **SameSite:** `Lax`
- **File size:** ~100 bytes

The cookie is set client-side via `document.cookie`. No server-side cookie parsing is needed.

## Integrating Third-Party Scripts

This plugin manages **consent preferences** — it does not load or block any third-party scripts
on its own. You must use the consent state stored in `window.__ccConsent` to decide when to
initialize tracking, advertising, and functional services.

The `window.__ccConsent` object has this shape:

```ts
interface ConsentState {
  necessary: true;       // Always true, cannot be disabled
  functional: boolean;   // User opted into functional cookies
  analytics: boolean;    // User opted into analytics cookies
  marketing: boolean;    // User opted into marketing/advertising cookies
}
```

### When to Check Consent

There are two moments when you need to check consent:

1. **On page load** — `window.__ccConsent` is already populated by the gate script. Check it
   before initializing any service.
2. **On consent change** — The `__ccAccept`, `__ccReject`, and `__ccSave` functions update
   `window.__ccConsent` and the cookie. If scripts are already loaded, you may want to
   enable/disable features dynamically.

### Google Analytics 4 (Analytics category)

Load GA4 only if the user has accepted the **Analytics** category:

```html
<script is:inline>
  if (window.__ccConsent?.analytics) {
    // DataLayer setup (required before gtag.js)
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", "G-XXXXXXXXXX");

    // Load gtag.js
    var s = document.createElement("script");
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
    s.async = true;
    document.head.appendChild(s);
  }
</script>
```

If the user later changes consent (e.g., from Reject to Accept via reopen + Save), you
can listen for the change by wrapping the above in a helper:

```html
<script is:inline>
  function initGA4() {
    if (window._ga4Loaded || !window.__ccConsent?.analytics) return;
    window._ga4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", "G-XXXXXXXXXX");
    var s = document.createElement("script");
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
    s.async = true;
    document.head.appendChild(s);
  }

  // Try on load
  initGA4();

  // Monkey-patch __ccSave to re-check on consent change
  var origSave = window.__ccSave;
  if (origSave) {
    window.__ccSave = function() {
      origSave.apply(this, arguments);
      initGA4();
    };
  }
</script>
```

### Facebook Pixel / Meta Pixel (Marketing category)

```html
<script is:inline>
  if (window.__ccConsent?.marketing) {
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return; n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n; n.push=n; n.loaded=!0; n.version="2.0";
      n.queue=[]; t=b.createElement(e); t.async=!0;
      t.src=v; s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", "YOUR_PIXEL_ID");
    fbq("track", "PageView");
  }
</script>
```

### Google Tag Manager (multi-category)

GTM can serve analytics, marketing, and functional tags. Map GTM's built-in consent
signals to the plugin's consent state:

```html
<script is:inline>
  if (window.__ccConsent?.analytics || window.__ccConsent?.marketing) {
    window.dataLayer = window.dataLayer || [];

    // Tell GTM about the consent state using the default consent command
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });

    // Map plugin categories to GTM consent types
    window.dataLayer.push({
      "consent": "default",  // or "update" on change
      "analytics_storage": window.__ccConsent?.analytics ? "granted" : "denied",
      "ad_storage": window.__ccConsent?.marketing ? "granted" : "denied",
      "ad_user_data": window.__ccConsent?.marketing ? "granted" : "denied",
      "ad_personalization": window.__ccConsent?.marketing ? "granted" : "denied",
      "functionality_storage": window.__ccConsent?.functional ? "granted" : "denied",
      "personalization_storage": window.__ccConsent?.functional ? "granted" : "denied",
      "security_storage": "granted",  // Always granted (necessary)
    });

    var s = document.createElement("script");
    s.src = "https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX";
    s.async = true;
    document.head.appendChild(s);
  }
</script>
```

### YouTube Embeds (Functional category)

YouTube videos set cookies even when embedded. Either conditionally render the embed
based on consent, or use a click-to-load wrapper:

```html
<script is:inline>
  // On page load, replace YouTube placeholders with actual embeds if consented
  document.querySelectorAll("[data-youtube-id]").forEach(function(el) {
    if (window.__ccConsent?.functional) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + el.dataset.youtubeId;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowfullscreen = true;
      iframe.style.width = "100%";
      iframe.style.height = el.dataset.height || "360";
      el.parentNode.replaceChild(iframe, el);
    } else {
      // Show a placeholder with a "Load video" button
      el.innerHTML = '<div style="padding:2rem;text-align:center;background:#f0f0f0;border-radius:8px">' +
        '<p>This video requires functional cookies.</p>' +
        '<button onclick="window.__ccShow();document.querySelector(\'[data-youtube-id]\').scrollIntoView()">Manage Preferences</button>' +
        '</div>';
    }
  });
</script>
```

### Summary: Category Mapping

| Service | Category | Notes |
|---|---|---|
| Google Analytics 4 | `analytics` | Load gtag.js conditionally |
| Google Tag Manager | `analytics` / `marketing` | Map consent types to GTM's `consent` command |
| Facebook Pixel | `marketing` | Load fbevents.js conditionally |
| YouTube / Vimeo | `functional` | Use click-to-load or conditional iframe |
| Intercom / Drift | `functional` | Initialize chat widget conditionally |
| Hotjar / CrazyEgg | `analytics` | Load heatmap script conditionally |
| Stripe / payment | `necessary` | Always load (no consent check needed) |

### Important Notes

- **The plugin does not block any scripts.** It only provides the consent state.
  Script blocking is your responsibility.
- **Place all conditional scripts after the gate script** (the one that sets
  `window.__ccConsent`), which is injected in `<head>` by the plugin. Any inline
  script in `<head>` after `EmDashHead` will have access to `window.__ccConsent`.
- **For `<body:end>` scripts**, `window.__ccConsent` is always available.
- **Consider legal review.** This plugin helps you implement technical consent
  management, but your specific setup may have additional legal requirements
  (cookie lists, data processing records, etc.).

## User Flow

```
First visit              Saved preferences          Changed preferences
┌──────────────┐         ┌──────────────┐           ┌──────────────┐
│ Banner shows  │         │ Banner hidden │           │ Banner hidden │
│ with defaults │         │ Reopen btn    │           │ Reopen btn    │
└──────┬───────┘         │ visible      │           │ visible      │
       │                 └──────┬───────┘           └──────┬───────┘
       ▼                        ▼                         ▼
┌──────────────┐         ┌──────────────┐           ┌──────────────┐
│ Click SA VE  │         │ Click reopen │           │ Click reopen │
│ Save custom  │         │ Toggles show  │           │ Toggles show  │
│ preferences  │         │ saved values │           │ saved values  │
└──────┬───────┘         └──────┬───────┘           └──────┬───────┘
       │                        │                          │
       ▼                        ▼                          ▼
┌──────────────┐         ┌──────────────┐           ┌──────────────┐
│ Cookie set   │         │ Adjust &     │           │ Accept All   │
│ Banner hides │         │ Save again   │           │ overwrites    │
│ Reopen shows │         │ Cookie       │           │ cookie       │
└──────────────┘         │ updated      │           └──────────────┘
                         └──────────────┘
```

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). The plugin uses standard DOM APIs (`document.cookie`, `querySelectorAll`, `requestAnimationFrame`, `Element.remove()`). No polyfills required.

## Development

```bash
git clone https://github.com/adrianoamalfi/emdash-plugin-cookie-consent.git
cd emdash-plugin-cookie-consent
npm install
```

The plugin is pure TypeScript — no build step needed. EmDash loads it directly from source.

### Project Structure

```
emdash-plugin-cookie-consent/
├── src/
│   ├── index.ts            # Plugin descriptor (entrypoint, capabilities, admin pages)
│   └── sandbox-entry.ts    # Hook handlers, settings, banner generation
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: type check + package validation on push/PR
│       └── release.yml     # Release: auto-create GitHub Release on tag push
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
└── .gitignore
```

### Scripts

```bash
npm run typecheck    # Run TypeScript type checking
npm test             # Run test suite (vitest)
npm run test:watch   # Run tests in watch mode
npm run version      # Print current package version
```

### Tests

Tests validate the generated JavaScript code, runtime cookie logic, and plugin structure
without requiring EmDash to be installed. They run in CI on every push and PR.

```bash
npm test
```

Coverage includes:

- **Plugin descriptor** — exports, id, format, entrypoint, capabilities, admin pages
- **Gate script** — syntax, cookie parsing with and without consent, semicolon correctness
- **Banner functions** — `C()`, `B()`, `H()`, `__ccAccept/Reject/Customize/Save/Show` definitions
- **Consent values** — correct true/false for each category in Accept/Reject/Save
- **Toggle restoration** — `B()` restores checked state from `__ccConsent`
- **Immediate removal** — `H()` uses `b.remove()` without `setTimeout`
- **RAF guard** — `isConnected` check prevents race condition
- **CSS selectors** — all required styles exist
- **Constants** — 4 categories, 6 themes, 20 KEY_MAP entries, 20 form fields
- **KEY_MAP alignment** — every action_id in KEY_MAP has a matching form field
- **HTML escaping** — `h()` escapes `& < > "` correctly

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to
automate versioning and changelog generation. Every commit message must follow
this format:

```
<type>: <description>

[optional body]
```

| Type | Release | Example |
|---|---|---|
| `fix` | Patch bump (1.0.0 → 1.0.1) | `fix: banner reappears after page navigation` |
| `feat` | Minor bump (1.0.0 → 1.1.0) | `feat: add scroll-triggered banner delay` |
| `BREAKING CHANGE` | Major bump (1.0.0 → 2.0.0) | `feat: replace cookie engine\n\nBREAKING CHANGE: drop SameSite=None support` |
| `chore`, `docs`, `refactor`, `test`, `style` | No release | `docs: fix typo in README` |

### Why

- **Automatic releases** — pushing `feat:` or `fix:` commits to `main` triggers
  semantic-release, which bumps the version, updates `CHANGELOG.md`, creates a git
  tag, and publishes a GitHub Release — all without manual intervention.
- **Human-readable changelog** — every `fix:`, `feat:`, and `BREAKING CHANGE`
  appears in the right section of `CHANGELOG.md`.
- **Clean git history** — no more `v1.0.1` commits mixed with code changes.

### Workflow

```bash
# Make changes and commit with conventional format
git add -A
git commit -m "fix: correct cookie value encoding on Save Preferences"
git push

# That's it. Semantic Release on CI handles the rest:
#   1. Detects "fix:" → patch bump
#   2. Updates CHANGELOG.md
#   3. Bumps version in package.json
#   4. Creates git tag v1.0.1
#   5. Creates GitHub Release with release notes
```

The [Release workflow](.github/workflows/release.yml) runs on every push to
`main`. The `semantic-release` CLI determines whether a release is needed based
on the commit messages since the last tag.

## CI

Pull requests and pushes to `main` run:

- **Type checking** — `tsc --noEmit` ensures type safety
- **Package validation** — Verifies `package.json` structure (name, version, exports, peer deps)

All checks must pass before merging.

## License

MIT © Adriano Amalfi

## License

MIT © Adriano Amalfi
