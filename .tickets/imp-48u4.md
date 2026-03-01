---
id: imp-48u4
status: closed
deps: []
links: []
created: 2026-02-28T23:45:39Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [foundation, composable]
---
# Create useStaticMode composable and VITE_STATIC_MODE env var

## Phase 1: Foundation — Create the static mode infrastructure

### Summary
Create the `useStaticMode()` composable and configure the `VITE_STATIC_MODE` build-time environment variable. This is the foundational piece that all other tasks depend on.

### What to implement

**1. Environment variable declaration (`src/vite-env.d.ts`)**
Add the `VITE_STATIC_MODE` env var to the Vite type declarations:
```ts
interface ImportMetaEnv {
  readonly VITE_STATIC_MODE?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ALLOWED_HOSTS?: string
}
```

**2. New composable: `src/composables/useStaticMode.ts`**
```ts
/**
 * Build-time static mode composable.
 * When VITE_STATIC_MODE=true, all interactive/API-dependent UI is excluded.
 * This is used for GitHub Pages deployment where no API proxy is available.
 */
export function useStaticMode() {
  // Vite replaces import.meta.env.VITE_STATIC_MODE at build time,
  // so dead-code elimination removes the interactive branches from the bundle.
  const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'
  return { isStaticMode }
}
```

**3. Update `.env.example`** to document the new variable:
```env
# STATIC MODE (GitHub Pages deployment)
# When set to "true", all edit buttons, settings panels, API key UI,
# and market refresh buttons are removed from the built output.
# VITE_STATIC_MODE=true
```

### Why a composable (not a global constant)?
- Consistent with existing codebase patterns (useStorage, useToast, useDataProvider, etc.)
- Allows future extension (e.g., reading additional config flags)
- Easy to mock/override in tests
- Vue composables are tree-shakeable

### Files to create/modify
- CREATE: `src/composables/useStaticMode.ts`
- MODIFY: `src/vite-env.d.ts` — add ImportMetaEnv interface
- MODIFY: `.env.example` — add VITE_STATIC_MODE documentation

### Acceptance criteria
- [ ] `useStaticMode()` composable exists and returns `{ isStaticMode: boolean }`
- [ ] `isStaticMode` is `false` by default (when VITE_STATIC_MODE is not set)
- [ ] `isStaticMode` is `true` when VITE_STATIC_MODE=true is set
- [ ] TypeScript types are properly declared for the env var
- [ ] `.env.example` documents the new variable
- [ ] Existing tests still pass

