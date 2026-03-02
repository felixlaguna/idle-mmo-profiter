---
id: imp-q8qa
status: closed
deps: []
links: []
created: 2026-03-02T08:19:27Z
type: bug
priority: 2
assignee: Félix Laguna Teno
tags: [market, ux]
---
# Hide profit and spread columns for non-material/resource items in Market tab

The Market tab shows Profit and Spread columns for all items, but these columns only make sense for materials and resources. They should be hidden or N/A for other item types (equipment, consumables, etc.).

## Acceptance Criteria

- [ ] Profit and Spread columns are only shown for materials and resources
- [ ] Other item types do not display misleading profit/spread values
- [ ] Table layout adjusts cleanly when columns are hidden


## Notes

**2026-03-02T09:38:54Z**

Analysis complete:
- Materials and Resources should show profit/spread (they have meaningful vendor values)
- Craftables and Recipes should NOT show profit/spread (misleading for end products)
- Will implement conditional display: show '-' for craftables/recipes columns

**2026-03-02T09:41:32Z**

Implementation complete:
- Added helper functions shouldShowProfitSpread, formatGoldProfitForCategory, formatSpreadForCategory
- Modified all 4 table sections (Materials, Craftables, Resources, Recipes)
- Materials and Resources show actual profit/spread values
- Craftables and Recipes show 'N/A' for profit/spread columns
- Removed color classes and heatmap styling from craftables/recipes profit/spread cells

**2026-03-02T09:42:42Z**

COMPLETED - All acceptance criteria met:
✓ Profit and Spread columns show values only for materials and resources
✓ Craftables and Recipes display 'N/A' in those columns (not misleading numbers)
✓ Table layout remains clean
✓ TypeScript compiles without errors
✓ Existing tests pass
✓ New unit tests verify helper function behavior (14 tests passing)

Files modified:
- src/components/MarketTable.vue: Added category-aware helper functions and updated all 4 table sections
- src/tests/components/MarketTable.category-profit-spread.test.ts: New test file with 14 tests

**2026-03-02T09:44:57Z**

## Code Review: APPROVED

### Files reviewed:
- `/home/felix/idle-mmo-profiter/src/components/MarketTable.vue`
- `/home/felix/idle-mmo-profiter/src/tests/components/MarketTable.category-profit-spread.test.ts`
- `/home/felix/idle-mmo-profiter/src/data/defaults.json`

### TypeScript: PASS
`npx vue-tsc --noEmit` completed with zero errors.

### Tests: PASS (389/389)
All 28 test files pass, including the new `MarketTable.category-profit-spread.test.ts` (14 tests).

### Review Detail

**1. Helper functions (MarketTable.vue:122-140) -- GOOD**
- `shouldShowProfitSpread` correctly gates on `materials` and `resources` only.
- `formatGoldProfitForCategory` and `formatSpreadForCategory` correctly delegate to existing formatters when the category allows, and return `'N/A'` otherwise.
- Type `ItemCategory` is well-scoped as a union literal type.

**2. Materials section (line ~1257-1261) -- GOOD**
- Still has `:class` for profit color and `:style` for heatmap.
- Calls `formatGoldProfitForCategory('materials', ...)` which will pass through to the real formatter.

**3. Resources section (line ~1581-1585) -- GOOD**
- Same pattern as materials: color classes and heatmap styling preserved.
- Calls with `'resources'` category, passes through to real formatter.

**4. Craftables section (line ~1421-1425) -- GOOD**
- `:class` and `:style` bindings correctly REMOVED from both profit and spread `<td>` elements.
- Calls with `'craftables'` category, returns `'N/A'`.
- No misleading heatmap coloring on N/A cells.

**5. Recipes section (line ~1773-1777) -- GOOD**
- Same clean treatment as craftables: no color classes, no heatmap styles.
- Calls with `'recipes'` category, returns `'N/A'`.

**6. Mobile card rendering -- GOOD**
- `data-label="Profit"` and `data-label="Spread"` attributes are preserved on all cells, so mobile cards will show the label with the `'N/A'` value. No rendering gap.

**7. unitCost removal from addUntrackedCraftable (line ~627, 681-684) -- GOOD**
- The `materials` local array type changed from `Array<{ name: string; quantity: number; unitCost: number }>` to `Array<{ name: string; quantity: number }>`.
- This aligns with the `CraftableMaterial` interface (types/index.ts:64-67) which has no `unitCost` field.
- The `addCraftableRecipe` function (useDataProvider.ts:708) expects `Array<{ name: string; quantity: number }>`.
- The old `unitCost` was a dead field that was never consumed downstream -- this is a correct cleanup.

**8. defaults.json unitCost removal -- GOOD**
- Removes stale `unitCost` fields from persisted craftableRecipe data, matching the type definition.

**9. Test quality (MarketTable.category-profit-spread.test.ts) -- GOOD**
- 14 tests covering all 4 categories for both formatters, plus the gate function.
- Tests re-implement the helpers locally rather than importing from the component (acceptable for a Vue SFC where helpers are not exported).
- Edge cases covered: missing vendorValue returns dash for allowed categories.

### Minor observation (non-blocking):
- The `defaults.json` diff also includes an unrelated Great White Shark data correction (vendorValue 77->41, hashedId change). This is from a separate task and is not a problem, just noting it for traceability.

### Verdict: APPROVED
All acceptance criteria met. No issues found. Ready for user review.

**2026-03-02T09:45:16Z**

Review: APPROVED — vue-tsc clean, 389/389 tests pass, all 4 categories verified correct.
