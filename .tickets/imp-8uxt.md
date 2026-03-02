---
id: imp-8uxt
status: closed
deps: [imp-3rmq]
links: []
created: 2026-03-02T08:13:53Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-ivrt
---
# Verify and test vendor/market hero indicator

## What
Verify the feature works correctly across all scenarios and viewports.

## Verification checklist
1. When best action is a resource with vendor as best method -> hero shows 'Vendor' badge in gold/amber
2. When best action is a resource with market as best method -> hero shows 'Market' badge in blue
3. When best action is a dungeon -> no sale method badge shown
4. When best action is a craftable -> no sale method badge shown
5. Mobile layout (375px, 393px) does not break or overflow
6. Desktop layout (1440px) looks correct with proper spacing
7. Existing tests in the project still pass (npm run test)
8. TypeScript compilation succeeds (npm run type-check or build)
9. Linter passes (npm run lint)

## Testing approach
- Run existing test suite to ensure no regressions
- Visual QA at 3 viewports (375/393/1440) using the visual QA workflow
- Manually verify by examining the data: check which resources have vendor vs market as bestMethod in resourceCalculator output

## Acceptance Criteria

- All existing tests pass
- TypeScript compiles without errors
- Visual QA screenshots confirm correct appearance at all viewports
- No layout overflow or truncation issues on mobile


## Notes

**2026-03-02T08:21:17Z**

Verification complete:
- All 359 tests pass (353 existing + 6 new profitRanker tests)
- TypeScript compilation successful (vue-tsc passed)
- Linter passed with no errors
- Visual QA screenshots captured at 3 viewports (375/393/1440)
- Implementation verified:
  * saleMethod field correctly populated for resources
  * v-if correctly hides badge for non-resources
  * CSS styling matches ResourceTable conventions
  * Mobile responsive styling added
  * Accessibility attributes included (aria-label)
