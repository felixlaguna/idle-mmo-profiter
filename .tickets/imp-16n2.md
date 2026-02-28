---
id: imp-16n2
status: closed
deps: [imp-bcj9]
links: []
created: 2026-02-28T23:05:36Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6by4
---
# Phase 2: Add GitHub Actions deployment workflow

Create a new GitHub Actions workflow that builds the app and deploys to GitHub Pages using the modern `actions/deploy-pages` approach (artifact-based, no gh-pages branch).

**File to create:** `.github/workflows/deploy.yml`

**Workflow design:**
- **Trigger:** Push to `master` branch only (no PRs)
- **Concurrency:** Use `concurrency` group to prevent overlapping deploys; cancel in-progress runs
- **Permissions:** `contents: read`, `pages: write`, `id-token: write` (required for OIDC-based Pages deployment)

**Jobs:**

1. **build** job:
   - `ubuntu-latest` runner
   - Checkout with `actions/checkout@v4`
   - Setup Node 22 with npm cache via `actions/setup-node@v4`
   - `npm ci`
   - `npm run build` (runs `vue-tsc && vite build`, outputs to `dist/`)
   - Upload `dist/` as Pages artifact via `actions/upload-pages-artifact@v3`

2. **deploy** job (depends on `build`):
   - Runs in `environment: github-pages` (auto-creates the environment)
   - Uses `actions/deploy-pages@v4` to publish the artifact
   - Outputs the deployed URL

**Notes:**
- The existing CI workflow (`.github/workflows/ci.yml`) is untouched; it continues to run lint, typecheck, test, and build on push + PRs
- This deploy workflow is intentionally separate from CI -- it only triggers on master push, not PRs
- No need to add `CNAME` or custom domain config

## Acceptance Criteria

- .github/workflows/deploy.yml exists and is valid YAML
- Workflow triggers only on push to master
- Uses actions/upload-pages-artifact@v3 and actions/deploy-pages@v4
- Concurrency group prevents overlapping deployments
- Correct permissions are set (contents: read, pages: write, id-token: write)


## Notes

**2026-02-28T23:07:37Z**

GitHub Actions workflow created at /home/felix/idle-mmo-profiter/.github/workflows/deploy.yml. Workflow configured with: push trigger on master, correct permissions (contents:read, pages:write, id-token:write), concurrency group for pages, environment setup, and deployment steps using actions/configure-pages@v5, actions/upload-pages-artifact@v3, and actions/deploy-pages@v4.
