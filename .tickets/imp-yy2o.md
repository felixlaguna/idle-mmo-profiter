---
id: imp-yy2o
status: closed
deps: [imp-16n2]
links: []
created: 2026-02-28T23:05:45Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6by4
---
# Phase 3: Enable GitHub Pages via gh CLI

Configure the GitHub repository to use GitHub Actions as the Pages source, so the deploy workflow can publish to Pages.

**Command to run:**
```bash
gh api repos/felixlaguna/idle-mmo-profiter/pages \
  -X POST \
  -f build_type=workflow \
  -f source.branch=master \
  -f source.path=/
```

If Pages is already enabled but set to a different source (e.g., branch-based), update it:
```bash
gh api repos/felixlaguna/idle-mmo-profiter/pages \
  -X PUT \
  -f build_type=workflow \
  -f source.branch=master \
  -f source.path=/
```

**Verification:**
```bash
gh api repos/felixlaguna/idle-mmo-profiter/pages --jq '.build_type'
# Should output: workflow
```

**Notes:**
- This requires the repo owner to have admin access
- The `github-pages` environment is auto-created when Pages is first enabled
- After enabling, the deploy workflow (Phase 2) will be able to publish on next push to master

## Acceptance Criteria

- gh api confirms build_type is 'workflow'
- The deploy workflow runs successfully on next push to master
- Site is accessible at https://felixlaguna.github.io/idle-mmo-profiter/


## Notes

**2026-02-28T23:07:54Z**

GitHub Pages enabled successfully via gh CLI. Configuration verified: build_type=workflow, html_url=https://felixlaguna.github.io/idle-mmo-profiter/, https_enforced=true. The site will be deployed automatically on the next push to master.
