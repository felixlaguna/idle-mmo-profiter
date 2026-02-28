---
id: imp-bcj9
status: closed
deps: []
links: []
created: 2026-02-28T23:05:23Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6by4
---
# Phase 1: Configure Vite base path for GitHub Pages subpath

Add `base: '/idle-mmo-profiter/'` to the Vite config so all built assets (JS, CSS) use the correct subpath when served from GitHub Pages.

**File to modify:** `vite.config.ts`

**Changes:**
- Add `base: '/idle-mmo-profiter/'` to the `defineConfig` object

**Notes:**
- The app uses NO vue-router, so no router base path adjustment is needed
- All JSON data is imported at build time (bundled), not fetched at runtime -- no path issues
- No `public/` directory exists -- no static asset path concerns
- The `index.html` uses `src="/src/main.ts"` which Vite rewrites at build time -- this is handled automatically by the `base` config
- The dev server proxy (`/api`) is only used in development and is unaffected

## Acceptance Criteria

- vite.config.ts has base: '/idle-mmo-profiter/'
- npm run build succeeds
- Built assets in dist/ reference /idle-mmo-profiter/ prefix in their paths


## Notes

**2026-02-28T23:07:15Z**

Vite base path configured successfully. Modified /home/felix/idle-mmo-profiter/vite.config.ts to add base: '/idle-mmo-profiter/'. Build verified successful. All 274 tests passing.
