---
id: imp-8pgu
status: closed
deps: []
links: []
created: 2026-03-05T20:29:18Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-znq2
---
# Add CI resilience: concurrency, manual dispatch, and retry logic

Apply three small changes to ci.yml and deploy.yml to reduce flaky CI failures:

## 1. Add concurrency control to ci.yml

File: `.github/workflows/ci.yml`

Add top-level concurrency group (deploy.yml already has one):
```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```
Place it after the `on:` block, before `jobs:`.

## 2. Add workflow_dispatch trigger to ci.yml and deploy.yml

This lets maintainers manually re-run workflows from the GitHub Actions UI
instead of pushing empty "chore: trigger CI" commits.

**ci.yml** -- add `workflow_dispatch:` to the `on:` block:
```yaml
on:
  workflow_dispatch:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master
```

**deploy.yml** -- add `workflow_dispatch:` to the `on:` block:
```yaml
on:
  workflow_dispatch:
  push:
    branches:
      - master
```

## 3. Add retry logic to Docker build steps

Use `nick-fields/retry@v3` for the Docker build step in both workflows.
This is the most network/infrastructure-dependent step.

**ci.yml** -- replace the "Build Docker image" step:
```yaml
- name: Build Docker image
  uses: nick-fields/retry@v3
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: docker compose build app
```

**deploy.yml** -- replace the "Build Docker image" step:
```yaml
- name: Build Docker image
  uses: nick-fields/retry@v3
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: docker compose build app
```

The `make ci` steps (lint, typecheck, test-run, build-app) all run inside
the already-built container with no network access needed, so they do NOT
need retry wrappers.

## Files to modify
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

## Files NOT to touch
- `.github/workflows/refresh-prices.yml` (self-hosted runner, different failure mode)

## Acceptance Criteria

- [ ] ci.yml has concurrency group `ci-${{ github.ref }}` with cancel-in-progress: true
- [ ] ci.yml has workflow_dispatch trigger
- [ ] deploy.yml has workflow_dispatch trigger
- [ ] ci.yml Docker build step uses nick-fields/retry@v3 with max_attempts: 3
- [ ] deploy.yml Docker build step uses nick-fields/retry@v3 with max_attempts: 3
- [ ] refresh-prices.yml is untouched
- [ ] Both workflows pass on push to master


## Notes

**2026-03-05T20:30:32Z**

Implementation complete.

Files modified:
- .github/workflows/ci.yml - Added workflow_dispatch trigger, concurrency control (ci-${{ github.ref }}), and retry logic to Docker build step
- .github/workflows/deploy.yml - Added workflow_dispatch trigger and retry logic to Docker build step

All changes applied as specified:
✓ ci.yml has workflow_dispatch trigger
✓ ci.yml has concurrency group with cancel-in-progress: true
✓ ci.yml Docker build uses nick-fields/retry@v3 with max_attempts: 3, timeout: 10min
✓ deploy.yml has workflow_dispatch trigger  
✓ deploy.yml Docker build uses nick-fields/retry@v3 with max_attempts: 3, timeout: 10min
✓ refresh-prices.yml untouched (verified via git status)

Ready for CI testing.
