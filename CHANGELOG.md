# 1.0.0 (2026-05-13)


### Bug Fixes

* use npx -p typescript tsc --noEmit in CI ([276f5cf](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/commit/276f5cfdc68a47a419c69ed25b1b557d2ce9e477))


### Features

* initial release - cookie consent banner plugin for EmDash CMS ([0d8470e](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/commit/0d8470e8450c7550aaf529814a69ad768d75e086))

# 1.0.0 (2026-05-13)


### Bug Fixes

* use npx -p typescript tsc --noEmit in CI ([276f5cf](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/commit/276f5cfdc68a47a419c69ed25b1b557d2ce9e477))


### Features

* initial release - cookie consent banner plugin for EmDash CMS ([0d8470e](https://github.com/adrianoamalfi/emdash-plugin-cookie-consent/commit/0d8470e8450c7550aaf529814a69ad768d75e086))

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are automated via [semantic-release](https://github.com/semantic-release/semantic-release)
using [Conventional Commits](https://www.conventionalcommits.org/).

## [1.0.0] — 2026-05-13

### Added

- Cookie consent banner with 4 categories: Necessary, Functional, Analytics, Marketing.
- Accept All, Reject All, and granular opt-in via inline customization panel.
- Floating reopen button ("Cookie Preferences") for changing consent after the initial choice.
- Admin settings panel at `/_emdash/admin` with full control over labels, colors, theme, position, and category names/descriptions.
- 6 built-in color themes: Dark, Light, Midnight, Clean, Warm, Forest.
- Custom color mode for arbitrary styling.
- Privacy policy link support.
- Mobile responsive layout.
- 365-day cookie persistence with `SameSite=Lax`.
- Toggle state restoration from saved preferences when reopening the banner.
- `window.__ccConsent` API for integrating third-party scripts (Google Analytics, Facebook Pixel, GTM, YouTube, etc.).
