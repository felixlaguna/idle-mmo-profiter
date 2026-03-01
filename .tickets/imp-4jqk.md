---
id: imp-4jqk
status: closed
deps: [imp-48u4]
links: []
created: 2026-02-28T23:46:52Z
type: task
priority: 1
assignee: Félix Laguna Teno
parent: imp-84k1
tags: [ci, deployment]
---
# Update GitHub Pages deploy workflow to set VITE_STATIC_MODE=true

## Phase 6: Update GitHub Actions deploy workflow for static mode

### Summary
The GitHub Pages deployment workflow must set `VITE_STATIC_MODE=true` as an environment variable during the build step so the static mode code paths are activated in the production bundle.

### What to implement

**Modify `.github/workflows/deploy.yml`:**
Add the environment variable to the build step:

```yaml
      # Build application inside Docker container
      # VITE_STATIC_MODE=true removes all API/edit/settings UI for static deployment
      - name: Build application
        run: docker compose run --rm -e VITE_STATIC_MODE=true app npm run build
```

The `-e VITE_STATIC_MODE=true` flag passes the env var into the Docker container where the Vite build runs. Vite will replace `import.meta.env.VITE_STATIC_MODE` with the literal string `"true"` at build time, enabling dead code elimination.

### Alternative approach (if Docker env passthrough has issues)
Could also set it in the docker-compose.yml build override, or use a `.env.production` file, but the `-e` flag on the `docker compose run` command is the cleanest approach.

### Files to modify
- MODIFY: `.github/workflows/deploy.yml`

### Acceptance criteria
- [ ] deploy.yml passes VITE_STATIC_MODE=true to the build step
- [ ] The built output for GitHub Pages does NOT contain settings/API/edit UI
- [ ] Local builds (without VITE_STATIC_MODE) still produce the full interactive app
- [ ] CI workflow (ci.yml) is NOT affected — it builds the full interactive version

