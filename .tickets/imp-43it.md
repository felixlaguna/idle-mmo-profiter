---
id: imp-43it
status: closed
deps: []
links: []
created: 2026-03-05T21:02:46Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-znq2
---
# Reconfigure self-hosted runner from repo-level to org-level registration

The self-hosted runner in `felixlaguna-dev/runner` is currently registered at repo-level (REPO_URL pointing to opos-alvaro). It needs to be reconfigured to org-level so it can pick up jobs from ALL repos in the felixlaguna-dev org.

## What to change (in the felixlaguna-dev/runner repo)

### 1. ansible/roles/github-runner/defaults/main.yml
- Remove `github_runner_repo_url` (or equivalent repo URL variable)
- Add `github_runner_org_name: felixlaguna-dev`

### 2. ansible/roles/github-runner/templates/docker-compose.runner.yml.j2
- Remove `REPO_URL: {{ github_runner_repo_url }}` environment variable
- Add `ORG_NAME: {{ github_runner_org_name }}` environment variable
- The myoung34/github-runner Docker image natively supports the ORG_NAME env var for org-level registration

### 3. Registration token
- The current registration token (stored as a secret or in the runner config) is a repo-level token
- User must generate a new **org-level** registration token from: GitHub > felixlaguna-dev org > Settings > Actions > Runners > New self-hosted runner
- Update the token secret/variable wherever it is stored (Ansible vault, env file, etc.)

## Notes
- The myoung34/github-runner image uses ORG_NAME (instead of REPO_URL) to determine org-level registration -- no other image config changes needed
- After redeployment, the runner will appear under the org's runner list instead of a single repo's runner list
- All repos in the org (idle-mmo-profiter, opos-alvaro, etc.) will be able to use the runner via runs-on: self-hosted

## Acceptance Criteria

1. defaults/main.yml uses org_name variable instead of repo_url variable
2. docker-compose template uses ORG_NAME env var instead of REPO_URL
3. Registration token is updated to org-level token
4. Runner redeploys successfully and appears in org-level runner list (GitHub > felixlaguna-dev > Settings > Actions > Runners)
5. Jobs from multiple repos (idle-mmo-profiter, opos-alvaro) can be picked up by the runner

