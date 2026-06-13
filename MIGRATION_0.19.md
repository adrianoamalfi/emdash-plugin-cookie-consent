# Migration Guide: EmDash 0.19.0 Compatibility

## Overview
This plugin has been updated to be fully compatible with EmDash 0.19.0. All breaking changes have been addressed.

## Key Changes

### 1. File Structure
- **Before**: Separate `src/index.ts` (descriptor) and `src/sandbox-entry.ts` (runtime)
- **After**: Consolidated `src/index.ts` with both descriptor factory and plugin runtime
- **Action**: Delete the old `src/sandbox-entry.ts` file (no longer needed)

### 2. Imports
- **Before**: `import type { SandboxedPlugin, PluginContext } from "emdash/plugin"`
- **After**: `import { definePlugin } from "emdash"`
- **Before**: `satisfies SandboxedPlugin`
- **After**: Uses `definePlugin()` for native plugins

### 3. Package Exports
- **Before**: 
  ```json
  "exports": {
    ".": "./src/index.ts",
    "./sandbox": "./src/sandbox-entry.ts"
  }
  ```
- **After**: 
  ```json
  "exports": {
    ".": "./src/index.ts"
  }
  ```

### 4. Plugin Definition
- **Before**: Default export was just the plugin object
- **After**: Default export is a complete `definePlugin()` result, with separate `cookieConsentPlugin()` factory for the descriptor

### 5. Compatibility Range
- **Before**: `emdash: "^0.14.0"`
- **After**: `emdash: ">=0.17.0"` (peer), `^0.19.0` (dev)

## What Works the Same

- ✅ `page:fragments` hook still injects CSS, scripts, and HTML
- ✅ Block Kit admin form structure unchanged
- ✅ KV storage API unchanged
- ✅ All cookie consent functionality preserved

## Hook Changes
The `page:fragments` hook now has a stricter type:
- Returns `null` if no fragments
- Returns a single `PageFragmentContribution` or array of them
- Each contribution has `kind`, `placement`, and contribution-specific fields

## Testing

```bash
npm install
npm run typecheck
npm test
```

## Breaking Changes for Users
Sites using this plugin should:
1. Update to EmDash 0.19.0
2. Reinstall the plugin from npm
3. No code changes needed on the site (the API remains the same)

## Migration Path

If upgrading from EmDash 0.14.x:
1. EmDash 0.14.x → 0.17.x (interim, if needed)
2. EmDash 0.17.x → 0.19.0
3. No configuration changes needed on the site
