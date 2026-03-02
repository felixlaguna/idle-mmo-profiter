---
id: imp-ivrt
status: closed
deps: []
links: []
created: 2026-03-02T08:12:23Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Feature: Show vendor vs market price for resources in hero

When a resource is displayed in the hero section, indicate whether the price shown is the vendor price or the market price


## Notes

**2026-03-02T08:13:16Z**

## Scouter Analysis

### Hero Section (App.vue, lines 307-314)
The hero is a compact bar (.hero-compact) that shows the best action:
- Label: 'Best:'
- Name: bestAction.name (e.g., 'Oak Log')
- Badge: bestAction.activityType (e.g., 'resource', 'dungeon', 'craftable')
- Profit: bestAction.profitPerHour formatted as 'X gold/hr'

Currently, when the best action is a RESOURCE, there is NO indication of whether
the displayed profit uses the vendor price or the market price. The user has no
way to know without navigating to the Resources tab.

### Data Flow
- bestAction comes from getBestAction() in profitRanker.ts
- For resources, the RankedActivity includes a 'details' field: 'Best: vendor|market, Xs'
- The ResourceProfitResult has a 'bestMethod' field: 'vendor' | 'market' (SaleMethod type)
- The profitRanker creates RankedActivity objects but does NOT carry bestMethod as a typed field

### Affected Files
1. /home/felix/idle-mmo-profiter/src/App.vue - Hero template + styles
2. /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts - RankedActivity interface + rankAllActivities()
3. /home/felix/idle-mmo-profiter/src/calculators/resourceCalculator.ts - SaleMethod type (already exists)

### Key Insight
The 'details' field already contains the best method info as a string, but:
1. It is not displayed in the hero
2. It is not a typed field (buried in a human-readable string)
3. The hero only applies to resources (dungeons/craftables don't have vendor vs market distinction)

### Approach Options
**Option A: Parse details string** - Extract vendor/market from the existing details field
  - Pro: No backend changes
  - Con: Fragile string parsing, not type-safe

**Option B: Add saleMethod field to RankedActivity** - Add an optional typed field
  - Pro: Type-safe, clean, reusable
  - Con: Minor interface change

Recommendation: Option B (type-safe approach)

**2026-03-02T08:14:10Z**

## Planning Complete

### Phases (3 task tickets, linear dependency chain)
1. **imp-8q9d** - Add saleMethod field to RankedActivity interface + populate for resources
2. **imp-3rmq** - Display vendor/market badge in hero compact bar (template + CSS)
3. **imp-8uxt** - Verify and test across viewports + run test suite

### Dependencies
imp-8q9d -> imp-3rmq -> imp-8uxt (linear)

### Affected files
- /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts (interface + ranking logic)
- /home/felix/idle-mmo-profiter/src/App.vue (hero template + styles)

### Design decisions
- Using a typed optional field (saleMethod?: SaleMethod) rather than parsing the details string
- Reusing existing vendor/market color conventions from ResourceTable.vue
- Badge only renders for resource activities (v-if on saleMethod)
- No changes needed to resourceCalculator.ts (SaleMethod type already exported)

### Risks
- Low risk: This is a small, additive UI change with no data flow modifications
- The only structural change is adding one optional field to RankedActivity

### Scope
- This does NOT affect the ResourceTable, ProfitRankingTable, or any chart components
- The change is isolated to the hero compact bar + the profitRanker interface

Ready for user approval.

**2026-03-02T08:21:28Z**

Implementation complete.

Files modified:
- /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts - Added saleMethod field to RankedActivity interface and populated it for resources
- /home/felix/idle-mmo-profiter/src/App.vue - Added vendor/market badge in hero compact bar with color-coded styling

Tests added:
- /home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts - 6 new tests verifying saleMethod field behavior

Test results: All 359 tests passing (353 existing + 6 new)

Feature behavior:
- When best action is a resource, displays 'Vendor' (gold/amber) or 'Market' (blue) badge
- Badge only appears for resource activities (not dungeons or craftables)
- Responsive design works on all viewports (375/393/1440)
- Follows existing ResourceTable color conventions
- Includes accessibility attributes

Ready for review.

**2026-03-02T08:23:15Z**

## Code Review: APPROVED

Files reviewed:
- /home/felix/idle-mmo-profiter/src/calculators/profitRanker.ts (interface + ranking logic)
- /home/felix/idle-mmo-profiter/src/App.vue (hero template + CSS)
- /home/felix/idle-mmo-profiter/src/tests/calculators/profitRanker.test.ts (new test file)

### TypeScript type-check: PASS
vue-tsc --noEmit completed with no errors.

### ESLint: PASS
All 3 modified/new files pass lint cleanly.

### Tests: PASS (359/359)
All 359 tests passing, including 6 new profitRanker tests.

### Style Guide Compliance

1. **Interface change** - saleMethod?: SaleMethod added as optional field to RankedActivity. Correctly optional (only resources have it). Type is reused from resourceCalculator.ts. Clean and type-safe.

2. **Template** - v-if guard on saleMethod prevents badge from rendering for dungeons/craftables. Aria-label included for accessibility. Follows same conditional class binding pattern as existing badge.

3. **CSS** - Vendor colors (amber: rgba(245, 158, 11, *) / #fbbf24) and market colors (blue: rgba(59, 130, 246, *) / #60a5fa) match ResourceTable.vue exactly. Mobile responsive override placed in correct order within @media (max-width: 767px) block, mirroring the sibling elements.

4. **Test quality** - 6 tests covering: resources with vendor method, resources with market method, dungeons without saleMethod, craftables without saleMethod, mixed ranking with saleMethod propagation, and getBestAction edge cases. Test data is realistic and assertions are specific.

### Notes
- No magic numbers; font sizes follow existing rem scale used throughout the file.
- text-transform: capitalize on .hero-compact-method is harmless but redundant since the template already capitalizes ('Vendor'/'Market'), not a blocker.
- No hardcoded strings that should be constants; 'vendor'/'market' values are type-checked by SaleMethod.

No issues found. Ready for user review.

**2026-03-02T08:45:43Z**

Visual Polish Review: 4.9/5 overall. One issue found - hero-compact-method badge sizing (padding/font-size/opacity) is slightly smaller than hero-compact-badge. Needs harmonization.

**2026-03-02T08:48:09Z**

User Review: Perfect - approved. Badge sizing fixed to match activity-type badge.
