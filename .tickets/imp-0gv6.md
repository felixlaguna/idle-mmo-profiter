---
id: imp-0gv6
status: closed
deps: []
links:
  - imp-znq2
created: 2026-03-05T00:00:00Z
type: bug
priority: 2
assignee: Félix Laguna Teno
---
# Fix Docker-in-Docker CI: use docker run instead of docker compose run

## Problem
The self-hosted runner runs inside Docker with a shared Docker socket. When `docker compose run --rm app npm run lint` executes, the `.:/app` volume mount in docker-compose.yml resolves to the runner CONTAINER's path, but the Docker daemon on the HOST doesn't have that path. Result: empty `/app` directory inside the CI container → `package.json not found`.

## Solution
The Dockerfile already copies all source code into the image (`COPY . .`). The volume mount in docker-compose.yml is only needed for local development (hot reloading). In CI, we should use `docker run` with the already-built image instead of `docker compose run`.

## Implementation
1. Create CI-specific Makefile targets (ci-lint, ci-typecheck, ci-test-run, ci-build-app)
2. These targets use `docker run` instead of `docker compose run`
3. Update the `ci` meta-target to call the new CI-specific targets
4. Keep existing targets (lint, typecheck, etc.) unchanged for local development

## Files to Modify
- `Makefile` - Add CI-specific targets that use `docker run`

## Notes

**2026-03-05T21:51:15Z**

Implementation complete. Modified Makefile to add CI-specific targets:
- ci-lint: uses docker run instead of docker compose run
- ci-typecheck: uses docker run instead of docker compose run  
- ci-test-run: uses docker run instead of docker compose run
- ci-build-app: uses docker run instead of docker compose run
- Updated ci meta-target to call the new CI-specific targets

Local development targets (lint, typecheck, test-run, build-app) remain unchanged and still use docker compose run with volume mounts for hot reloading.

The new CI targets use the built image (idle-mmo-profiter-app) directly without volume mounts, which avoids the Docker-in-Docker path resolution issue.
