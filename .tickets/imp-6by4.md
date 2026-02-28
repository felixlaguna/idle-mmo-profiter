---
id: imp-6by4
status: closed
deps: []
links: []
created: 2026-02-28T23:04:25Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Deploy to GitHub Pages

Set up GitHub Actions workflow to build and deploy the Vite app to GitHub Pages at https://felixlaguna.github.io/idle-mmo-profiter/


## Notes

**2026-02-28T23:06:05Z**

## Planning Complete -- Scouter Analysis

### Codebase Analysis

**Routing:** No vue-router. The app is a single-page tab-based UI (App.vue manages tabs via ref). No router base path changes needed.

**Data loading:** All JSON data is imported at build time via ES imports (e.g., `import defaultData from '../data/defaults.json'`). No runtime fetch calls to local data files -- the base path change will not break data loading.

**API calls:** The API client (`src/api/client.ts`) uses `/api/v1` as base URL in dev (proxied by Vite), and `VITE_API_BASE_URL` env var in production. For GitHub Pages (a static host), API calls go through the browser, so the user must have a direct API URL configured. This is existing behavior, not a deployment concern.

**Static assets:** No `public/` directory. The favicon is an inline data URI. Google Fonts are loaded via external CDN URLs. No local static asset paths to fix.

**index.html:** Uses `src="/src/main.ts"` which Vite rewrites during build. The `base` config handles this automatically.

### Affected Files

- `/home/felix/idle-mmo-profiter/vite.config.ts` -- add `base` option (1 line)
- `/home/felix/idle-mmo-profiter/.github/workflows/deploy.yml` -- new file (deploy workflow)
- Repository settings via `gh` CLI -- enable Pages with Actions source

### Phases (3 task tickets, linear dependency chain)

1. **imp-bcj9** -- Configure Vite base path
2. **imp-16n2** -- Add GitHub Actions deploy workflow (depends on 1)
3. **imp-yy2o** -- Enable GitHub Pages via gh CLI (depends on 2)

### Risks

- **API proxy not available in production:** The Vite dev proxy (`/api`) does not exist on GitHub Pages. This is already handled by the existing `VITE_API_BASE_URL` env var pattern. Not a new risk.
- **SPA refresh on subpath:** Since there is no client-side router, there are no deep link / 404 issues. The app is a single index.html.

### No Questions -- Ready for Approval

**2026-02-28T23:08:01Z**

Implementation complete. All 3 phases finished successfully.

Files modified:
- /home/felix/idle-mmo-profiter/vite.config.ts - Added base: '/idle-mmo-profiter/' for GitHub Pages subpath
- /home/felix/idle-mmo-profiter/.github/workflows/deploy.yml - New GitHub Actions workflow for automated deployment

GitHub Pages configuration:
- Enabled via gh CLI with build_type=workflow
- Deployment URL: https://felixlaguna.github.io/idle-mmo-profiter/
- HTTPS enforced: true
- Will deploy automatically on push to master

Tests: All passing (274/274)
Build: Verified successful

The site will be deployed on the next push to master branch.

**2026-02-28T23:09:08Z**

## Code Review — All 6 checks passed ✅

### 1. `vite.config.ts` — ✅ Correct
`base: '/idle-mmo-profiter/'` is set at line 10. Matches the GitHub Pages subpath exactly.

### 2. `.github/workflows/deploy.yml` — ✅ Valid
- **Trigger:** `push` to `master` branch — correct.
- **Permissions:** `contents: read`, `pages: write`, `id-token: write` — minimal and correct for Pages deployment.
- **Concurrency:** `group: pages`, `cancel-in-progress: true` — prevents overlapping deploys.
- **Node version:** `22` with `npm` cache — correct.
- **Actions versions:** All current — `checkout@v4`, `setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`.
- **Deploy artifact:** `path: ./dist` — matches Vite's default output directory.
- **Environment:** `github-pages` with URL output from deployment step — correct pattern.
- Uses `npm ci` for deterministic installs.

### 3. ESLint — ✅ 0 errors
`npx eslint .` produced no output (clean).

### 4. Tests — ✅ All pass
15 test files, **274/274 tests passed** in 3.03s. The stderr output is expected — tests for corrupted cache/JSON handling intentionally trigger parse errors to verify graceful recovery.

### 5. Build — ✅ Succeeds
`vue-tsc && vite build` completed in 2.38s. TypeScript type-checking passed. 12 output assets produced in `dist/`. Two informational warnings about dynamic vs static imports for cache.ts and services.ts — these are benign (Vite noting it can't code-split modules that are both statically and dynamically imported).

### 6. GitHub Pages API — ✅ Enabled correctly
- `build_type: "workflow"` — deploys from Actions, not from a branch.
- `source.branch: "master"` — correct default branch.
- `html_url: "https://felixlaguna.github.io/idle-mmo-profiter/"` — matches the configured base path.
- `https_enforced: true` — good.

### Verdict
All implementation is correct and ready to deploy. The workflow will trigger on the next push to master.

**2026-02-28T23:10:16Z**

Deployment successful. All steps green. Site live at https://felixlaguna.github.io/idle-mmo-profiter/
