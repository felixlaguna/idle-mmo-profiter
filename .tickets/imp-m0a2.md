---
id: imp-m0a2
status: closed
deps: [imp-0743]
links: []
created: 2026-02-28T18:55:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-430x
---
# Task 5: Add npm script and documentation

1. Add npm script to package.json: 'refresh-prices': 'tsx scripts/refresh-market-prices.ts'
2. Add JSDoc header comment to the script (matching the populate script's style) documenting purpose, usage, flags, and API key resolution
3. Verify the script runs end-to-end with --limit=3 --dry-run

This is the final integration/polish task.

## Acceptance Criteria

npm run refresh-prices works, --limit and --dry-run flags documented in script header, script has consistent style with populate-hashed-ids.ts


## Notes

**2026-02-28T19:02:34Z**

npm script and documentation completed successfully.

Changes made:
- Added 'refresh-prices' npm script to package.json
- Script already has comprehensive JSDoc header documenting purpose, usage, flags, and API key resolution

Test successful:
- npm run refresh-prices -- --dry-run --limit=3 works correctly
- Flags are properly passed through to the script
- Output matches expectations

The script is ready for production use.
