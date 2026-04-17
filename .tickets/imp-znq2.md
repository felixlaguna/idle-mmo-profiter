---
id: imp-znq2
status: closed
deps: []
links: []
created: 2026-03-05T20:26:58Z
type: bug
priority: 2
assignee: Félix Laguna Teno
---
# Fix: Flaky GitHub CI runs failing without apparent reason

GitHub Actions runs sometimes fail without any apparent reason. Need to investigate root cause and add resilience.


## Notes

**2026-03-05T20:28:38Z**

Investigation: CI failures are caused by GitHub infrastructure issue - 'The job was not acquired by Runner of type hosted even after multiple attempts'. Not a code bug. Fix: add job-level retries, concurrency controls, and workflow_dispatch triggers.

**2026-03-05T20:29:28Z**

## Planning Complete

### Scouter Analysis

Files affected (2):
- `.github/workflows/ci.yml` -- add concurrency group, workflow_dispatch trigger, retry on Docker build
- `.github/workflows/deploy.yml` -- add workflow_dispatch trigger, retry on Docker build

Files explicitly excluded:
- `.github/workflows/refresh-prices.yml` -- uses self-hosted runner, different failure mode

### Current State Observations

- deploy.yml already has a `concurrency` group for `pages` -- no change needed there
- ci.yml has NO concurrency group -- needs one scoped to `ci-${{ github.ref }}`
- Neither workflow has `workflow_dispatch` -- user has been pushing empty "chore: trigger CI" commits to retry
- Docker build is the only network-dependent step; `make ci` sub-targets run offline inside the container
- The `nick-fields/retry@v3` action is well-maintained and widely used for exactly this pattern

### Task Created

1 task ticket: `imp-8pgu` - Add CI resilience: concurrency, manual dispatch, and retry logic

### Risks

- Low risk: `nick-fields/retry@v3` is a third-party action; pinning to v3 tag is standard practice. Could alternatively use shell-level retry loop, but the action provides cleaner logs and timeout handling.
- No breaking changes: all modifications are additive (new triggers, new wrappers around existing commands).

Ready for user approval.

**2026-03-05T20:31:31Z**

## Code Review: APPROVED

Files reviewed:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

Verified `.github/workflows/refresh-prices.yml` was NOT modified (zero diff).

### YAML Syntax
PASS -- Both files parse correctly with Python yaml.safe_load.

### workflow_dispatch Trigger
PASS -- Correctly placed in the `on:` section of both files, with no value (bare key), which is valid GitHub Actions syntax for a parameterless manual trigger.

### Concurrency Block (ci.yml)
PASS -- New `concurrency:` block added between `on:` and `jobs:` with:
- `group: ci-${{ github.ref }}` (scoped per-branch, correct)
- `cancel-in-progress: true`
Deploy.yml's existing `concurrency: { group: pages, cancel-in-progress: true }` is preserved unchanged.

### nick-fields/retry@v3 Usage
PASS -- Both files use identical, correct configuration:
- `uses: nick-fields/retry@v3` (pinned to major version tag)
- `timeout_minutes: 10` (valid integer, reasonable for Docker build)
- `max_attempts: 3` (valid integer, reasonable retry count)
- `command: docker compose build app` (matches original run command exactly)

### Existing Functionality Preserved
PASS -- Compared original files (from HEAD) with modified versions:
- ci.yml: All 3 original steps present in same order. Only the Build Docker image step changed from `run:` to `uses: nick-fields/retry@v3`.
- deploy.yml: All 6 original steps present in same order. Only the Build Docker image step changed. Permissions block, environment config, and all other steps are untouched.

### Security
PASS -- `nick-fields/retry@v3` is pinned to a version tag (v3). This is a widely-used action (referenced in the planning notes). No secrets exposed, no new permissions added.

### No Issues Found
All 7 verification criteria pass. Changes are purely additive and correctly address the flaky CI problem described in the epic. Ready for user review.

**2026-03-05T20:31:45Z**

Review: Approved. All changes correct - YAML valid, retry action properly configured, existing functionality preserved, refresh-prices.yml untouched.

**2026-03-05T20:33:17Z**

User Review: Wrong target. 1) Actual failures are in refresh-prices.yml, not ci/deploy. 2) Both ci.yml and deploy.yml should use self-hosted runner instead of ubuntu-latest.

**2026-03-05T20:35:05Z**

## Iteration 2 - Corrected Plan

Previous plan (imp-8pgu) was wrong: it targeted ci.yml and deploy.yml for resilience changes but missed the actual failure point (refresh-prices.yml merge conflicts).

### Corrected Root Cause Analysis

The real failures happen in `refresh-prices.yml` at the commit step (lines 46-49):
```
git commit -m 'chore: refresh market prices'
git pull --rebase          # <-- FAILS with merge conflict
git push
```

When two cron runs (every 15 min) overlap, both modify `src/data/defaults.json`. The second run's `git pull --rebase` conflicts because the first run already pushed changes to the same file.

### What imp-8pgu got right (keep these)
- workflow_dispatch triggers on ci.yml and deploy.yml (already applied)
- concurrency group on ci.yml (already applied)
- retry logic on Docker build steps (already applied)

### What still needs to change
1. ci.yml and deploy.yml: switch `runs-on: ubuntu-latest` to `runs-on: self-hosted`
2. refresh-prices.yml: gracefully handle rebase conflicts in the commit step

### Files affected
- `.github/workflows/ci.yml` (line 18: runs-on)
- `.github/workflows/deploy.yml` (line 20: runs-on)
- `.github/workflows/refresh-prices.yml` (lines 39-50: commit step)

New task tickets being created.

**2026-03-05T20:35:49Z**

## Iteration 2 - Planning Complete

### Tasks Created (2 independent tasks, no dependencies between them)

1. **imp-5c96** - Switch ci.yml and deploy.yml to self-hosted runner
   - File: `.github/workflows/ci.yml` line 18
   - File: `.github/workflows/deploy.yml` line 20
   - Simple one-line change in each file

2. **imp-xp5f** - Fix refresh-prices.yml merge conflict race condition
   - File: `.github/workflows/refresh-prices.yml` lines 39-50
   - Wrap `git pull --rebase` in conditional; abort and skip on conflict

### No dependencies
Both tasks touch different files and can be implemented in either order or in parallel.

### Previous work preserved
The improvements from imp-8pgu (workflow_dispatch, concurrency groups, retry logic) are already applied to ci.yml and deploy.yml and will be kept.

### Risks
- Low: self-hosted runner must have Docker installed (it does -- refresh-prices.yml already uses it)
- Low: the conflict-skip approach means some price refreshes get discarded, but the next 15-min run will pick up fresh prices anyway

Ready for user approval.

**2026-03-05T20:37:51Z**

## Code Review: APPROVED

Files reviewed:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/refresh-prices.yml`

### 1. YAML Syntax
PASS -- All three files parsed correctly with Python yaml.safe_load.

### 2. runs-on: self-hosted
PASS -- Both ci.yml and deploy.yml changed from `ubuntu-latest` to `self-hosted`. refresh-prices.yml already used `self-hosted` (unchanged).

### 3. refresh-prices.yml Conflict Handling
PASS -- Logic is correct:
- `if ! git pull --rebase` catches rebase failures
- On failure: prints diagnostic message, runs `git rebase --abort`, sets `changed=false`, and exits cleanly with `exit 0`
- On success: proceeds to `git push` and sets `changed=true`
- The `exit 0` inside the if-block correctly terminates the step without failing the job
- Downstream steps (Build, Setup Pages, Upload, Deploy) all gate on `changed == 'true'`, so they are correctly skipped when rebase is aborted

### 4. Existing Functionality Preserved
PASS -- Verified by comparing committed (HEAD) versions against working tree:
- **ci.yml**: All 3 original steps present in same order (Checkout, Build Docker image, Run CI checks). Additions: `workflow_dispatch` trigger, `concurrency` block, retry wrapper on Docker build.
- **deploy.yml**: All 6 original steps present in same order (Checkout, Build Docker image, Build application, Setup Pages, Upload artifact, Deploy to GitHub Pages). Additions: `workflow_dispatch` trigger, retry wrapper on Docker build. Existing `concurrency`, `permissions`, and `environment` blocks preserved unchanged.
- **refresh-prices.yml**: All 8 original steps present in same order. Only the commit step's shell script was modified (rebase conflict guard added). All `if: steps.commit.outputs.changed == 'true'` conditionals on downstream steps are unchanged.

### 5. Security
PASS -- No new permissions added. `nick-fields/retry@v3` is pinned to major version tag (standard practice, widely used action). No secrets exposed. The self-hosted runner already runs refresh-prices.yml, so ci.yml and deploy.yml joining it does not introduce new attack surface.

### Additional Checks
- **workflow_dispatch**: Present in ci.yml and deploy.yml (new). Already present in refresh-prices.yml (unchanged).
- **concurrency**: ci.yml has new `ci-${{ github.ref }}` group with cancel-in-progress. deploy.yml retains existing `pages` group. refresh-prices.yml retains existing `refresh-prices` group with cancel-in-progress: false.
- **Retry on Docker build**: ci.yml and deploy.yml both use `nick-fields/retry@v3` with timeout_minutes: 10 and max_attempts: 3. refresh-prices.yml does NOT have retry (not in scope, it already uses self-hosted and has different failure mode).

### No Issues Found
All 5 verification criteria pass. Changes are correct and complete.

**2026-03-05T20:38:05Z**

Review: Approved. All 3 workflow files correct. Self-hosted runners set, conflict handling logic works, existing functionality preserved.

**2026-03-05T20:42:08Z**

Cancelled runs investigation: 9 refresh-prices runs cancelled before starting (runner busy/stuck), 3 ci/deploy manually cancelled by user. One deploy stuck for 3h32m. Root cause: self-hosted runner capacity/availability. Current fixes address merge conflicts and retries but runner infrastructure is separate.

**2026-03-05T21:02:20Z**

User confirms runner should be org-level. Currently configured with REPO_URL pointing to opos-alvaro (repo-level). Need to switch to ORG_NAME for org-level registration in the runner repo (felixlaguna-dev/runner).

**2026-03-05T21:02:52Z**

## Iteration 3 - Runner Org-Level Registration

New task created: imp-43it - Reconfigure self-hosted runner from repo-level to org-level registration

This task targets the separate runner repo (felixlaguna-dev/runner), not this repo's workflow files.

Changes:
- ansible/roles/github-runner/defaults/main.yml -- switch from repo URL to org name variable
- ansible/roles/github-runner/templates/docker-compose.runner.yml.j2 -- REPO_URL env var replaced with ORG_NAME
- Registration token must be regenerated as org-level token by user

This is independent of the previous tasks (imp-8pgu, imp-5c96, imp-xp5f) which are all closed.

**2026-03-05T21:05:08Z**

Runner repo updated: switched from repo-level (opos-alvaro) to org-level (felixlaguna-dev) registration. Commit 4b35ed7 pushed. User still needs to: 1) Generate org-level registration token, 2) Update RUNNER_REGISTRATION_TOKEN secret, 3) Redeploy runner.

**2026-03-05T21:10:28Z**

Crash-loop root cause: myoung34/github-runner needs ACCESS_TOKEN (PAT with admin:org) for org-level registration, not RUNNER_TOKEN. Fix: switch env var from RUNNER_TOKEN to ACCESS_TOKEN and store a PAT.

**2026-03-05T21:21:26Z**

Runner successfully deployed at org level. oracle-runner is online with labels: self-hosted, Linux, ARM64, oracle-cloud. Required fixes: RUNNER_SCOPE=org env var, ACCESS_TOKEN (PAT) instead of RUNNER_TOKEN, stale config cleanup.

**2026-03-05T21:35:32Z**

All changes committed and pushed. CI and Deploy runs queued behind active Refresh Prices job (single runner bottleneck). Runner confirmed online at org level.

**2026-03-05T21:51:37Z**

Docker-in-Docker CI fix complete (imp-0gv6).

## Changes
Modified Makefile to add CI-specific targets that use 'docker run' instead of 'docker compose run':
- ci-lint, ci-typecheck, ci-test-run, ci-build-app
- Updated 'ci' meta-target to call these new targets

## How it works
- Dockerfile copies all source code: COPY . .
- docker-compose.yml volume mount (.:/app) is only used for local dev hot-reloading
- CI targets use the built image directly (idle-mmo-profiter-app) without volume mounts
- This avoids the DinD path resolution issue where runner container paths don't exist on the host

## Testing
- Makefile syntax validated with 'make help'
- GitHub Actions workflow already calls 'make ci', no changes needed there
- The workflow builds the image first (docker compose build app), then runs 'make ci'

Ready for testing in the next CI run.

**2026-03-05T21:56:19Z**

All workflows passing: CI (55s), Deploy (35s), Refresh Prices (43m). All three workflows now use self-hosted runner with DinD-compatible docker run commands.

**2026-03-06T09:03:51Z**

All 3 workflows verified passing: CI, Deploy, Refresh Prices. DinD workarounds reverted. Root cause fixed by matching RUNNER_WORKDIR to host path.
