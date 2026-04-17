---
id: imp-5c96
status: closed
deps: []
links: []
created: 2026-03-05T20:35:14Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-znq2
---
# Switch ci.yml and deploy.yml to self-hosted runner

Switch both CI and deploy workflows from GitHub-hosted runners to the self-hosted runner.

## Changes

### File: `.github/workflows/ci.yml` (line 18)
Change:
```yaml
runs-on: ubuntu-latest
```
To:
```yaml
runs-on: self-hosted
```

### File: `.github/workflows/deploy.yml` (line 20)
Change:
```yaml
runs-on: ubuntu-latest
```
To:
```yaml
runs-on: self-hosted
```

## What to preserve (already applied from imp-8pgu)
- workflow_dispatch triggers on both files (already present)
- concurrency group on ci.yml (already present)
- nick-fields/retry@v3 on Docker build steps in both files (already present)

## Files to modify
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

## Files NOT to touch
- `.github/workflows/refresh-prices.yml`

## Acceptance Criteria

- [ ] ci.yml runs-on is self-hosted
- [ ] deploy.yml runs-on is self-hosted
- [ ] All existing workflow_dispatch, concurrency, and retry additions are preserved
- [ ] refresh-prices.yml is untouched
- [ ] Both workflows pass on push to master

