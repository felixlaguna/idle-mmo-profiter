---
id: imp-xp5f
status: closed
deps: []
links: []
created: 2026-03-05T20:35:31Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-znq2
---
# Fix refresh-prices.yml merge conflict race condition

Fix the race condition in refresh-prices.yml where concurrent cron runs cause merge conflicts on `git pull --rebase`.

## Root Cause
The workflow runs every 15 minutes via cron. When two runs overlap, both modify `src/data/defaults.json`. The second run's `git pull --rebase` fails with a merge conflict because the first run already pushed changes to the same file.

## Fix
If `git pull --rebase` fails (merge conflict), abort the rebase and skip the push. Rationale: if another run already pushed, that run has newer prices anyway, so this run's changes are stale.

### File: `.github/workflows/refresh-prices.yml` (lines 39-50, the 'Commit updated prices' step)

Replace the current commit logic:
```yaml
      - name: Commit updated prices
        id: commit
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add src/data/defaults.json
          if git diff --cached --quiet; then
            echo "changed=false" >> "\$GITHUB_OUTPUT"
          else
            git commit -m 'chore: refresh market prices'
            git pull --rebase
            git push
            echo "changed=true" >> "\$GITHUB_OUTPUT"
          fi
```

With:
```yaml
      - name: Commit updated prices
        id: commit
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add src/data/defaults.json
          if git diff --cached --quiet; then
            echo "changed=false" >> "\$GITHUB_OUTPUT"
          else
            git commit -m 'chore: refresh market prices'
            if \! git pull --rebase; then
              echo "Rebase conflict detected -- another run already pushed. Skipping."
              git rebase --abort
              echo "changed=false" >> "\$GITHUB_OUTPUT"
              exit 0
            fi
            git push
            echo "changed=true" >> "\$GITHUB_OUTPUT"
          fi
```

## Key behavioral change
- Before: workflow FAILS when rebase conflicts (red X in Actions UI)
- After: workflow SUCCEEDS but skips the push/deploy (changed=false), so no build/deploy steps run

## Files to modify
- `.github/workflows/refresh-prices.yml`

## Files NOT to touch
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

## Acceptance Criteria

- [ ] refresh-prices.yml commit step gracefully handles rebase conflicts
- [ ] On conflict: rebase is aborted, changed=false is output, exit 0 (success)
- [ ] On success: push happens, changed=true is output
- [ ] No-change case still works (git diff --cached --quiet skips commit)
- [ ] ci.yml and deploy.yml are untouched
- [ ] YAML is valid

