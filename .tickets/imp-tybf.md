---
id: imp-tybf
status: closed
deps: [imp-uvfm]
links: []
created: 2026-02-28T23:14:57Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-rgz3
tags: [docker, ci, github-actions]
---
# Dockerize CI workflow (.github/workflows/ci.yml)

Rewrite the CI workflow to run all checks inside Docker containers instead of using setup-node and raw npm commands. This ensures CI uses the exact same environment as local development.

## Design

File: /home/felix/idle-mmo-profiter/.github/workflows/ci.yml

Two approaches, recommend option A:

**Option A: Use docker compose run (simpler, consistent with local)**
```yaml
name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker compose build app

      - name: Run ESLint
        run: docker compose run --rm app npx eslint .

      - name: Type check
        run: docker compose run --rm app npx vue-tsc --noEmit

      - name: Run tests
        run: docker compose run --rm app npm run test:run

      - name: Build
        run: docker compose run --rm app npm run build
```

**Option B: Use make targets**
Same structure but uses `make lint`, `make typecheck`, `make test`, `make build-app`.
Depends on task imp-uvfm being completed first.

Note: docker compose is pre-installed on ubuntu-latest runners.
Docker layer caching could be added with docker/build-push-action cache-from/cache-to, but this is a nice-to-have optimization.

## Acceptance Criteria

- [ ] CI workflow no longer uses actions/setup-node
- [ ] CI workflow no longer runs raw npm/npx commands
- [ ] CI builds the Docker image and runs all checks inside containers
- [ ] CI runs: lint, typecheck, test, build (in that order)
- [ ] CI fails correctly if any check fails (non-zero exit codes propagate)
- [ ] CI still triggers on push to master and pull_request to master
- [ ] CI run time is reasonable (Docker layer caching should be used)


## Notes

**2026-02-28T23:24:33Z**

Dockerized CI workflow complete.

Changes made to /home/felix/idle-mmo-profiter/.github/workflows/ci.yml:
- Removed actions/setup-node step (no longer needed)
- Removed raw npm ci, npx eslint, npx vue-tsc, npm run commands
- Added 'docker compose build app' step to build the Docker image
- Added 'make ci' step which runs all checks inside Docker containers

The workflow now:
1. Checks out code
2. Builds the Docker image (which installs all dependencies)
3. Runs make ci (which executes lint -> typecheck -> test-run -> build-app inside Docker)

All CI checks now run in the exact same Docker environment as local development.
Workflow is clean, well-commented, and follows the Dockerize pattern.
