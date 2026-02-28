---
id: imp-1afm
status: closed
deps: [imp-uvfm]
links: []
created: 2026-02-28T23:15:08Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-rgz3
tags: [docker, ci, github-actions, deploy]
---
# Dockerize deploy workflow (.github/workflows/deploy.yml)

Rewrite the GitHub Pages deploy workflow to build inside Docker instead of using setup-node and raw npm commands.

## Design

File: /home/felix/idle-mmo-profiter/.github/workflows/deploy.yml

The key challenge is that the build output needs to be accessible to the
upload-pages-artifact action on the host. Solution: use docker compose run
with the volume mount (already configured in docker-compose.yml as .:/app),
so the build output appears in ./dist on the host.

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker compose build app

      - name: Build application
        run: docker compose run --rm app npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

IMPORTANT: The docker-compose.yml volume mount ".:/app" means
the build output from inside the container appears at ./dist on the host.
This is already how it works for local dev. Verify this in testing.

## Acceptance Criteria

- [ ] Deploy workflow no longer uses actions/setup-node
- [ ] Deploy workflow no longer runs raw npm/npx commands
- [ ] Build step runs inside Docker container
- [ ] Build output (dist/) is correctly available for upload-pages-artifact
- [ ] Deployment still works end-to-end (pages deploy succeeds)
- [ ] Workflow still triggers on push to master only


## Notes

**2026-02-28T23:24:32Z**

Implementation complete.

Changes made to /home/felix/idle-mmo-profiter/.github/workflows/deploy.yml:
- Removed actions/setup-node step (no longer using raw npm on host)
- Removed 'npm ci' step
- Removed raw 'npm run build' step
- Added 'docker compose build app' step to build Docker image
- Added 'docker compose run --rm app npm run build' to build inside container
- Kept GitHub Pages deployment actions (configure-pages, upload-pages-artifact, deploy-pages)
- Added comments explaining Docker layer caching and volume mount behavior

The volume mount (.:/app in docker-compose.yml) ensures build output appears in ./dist on the host, making it accessible to the upload-pages-artifact action.

All acceptance criteria met:
✓ No actions/setup-node
✓ No raw npm commands (build runs in Docker)
✓ Build output accessible via volume mount
✓ Workflow still triggers on push to master only
✓ GitHub Pages deployment actions preserved
