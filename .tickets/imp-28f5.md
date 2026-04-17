---
id: imp-28f5
status: closed
deps: []
links: []
created: 2026-03-23T09:56:02Z
type: epic
priority: 2
assignee: Félix Laguna Teno
---
# Add Construction skill & refresh equipment vendor prices

1. Fetch construction skill items/materials/recipes from API and add to resources tab for profit tracking. 2. Refresh vendor prices for all mythical and legendary equipment items.


## Notes

**2026-03-23T09:59:06Z**

## Planning Complete

### Codebase Analysis Summary

**How skills work in the Resources tab:**
- ResourceSkill type (src/types/index.ts:99) defines valid skills: smelting, cooking, woodcutting, mining, fishing, hunt, dungeon
- resourceRecipes[] in defaults.json holds recipes with skill field (currently only smelting and cooking recipes exist)
- resourceGathering[] holds raw materials (ores, fish, logs) with skill field (mining, fishing, woodcutting)
- useDataProvider.ts auto-generates 3 modes per recipe: Buy All, Gather, Gather All
- ResourceTable.vue displays skill badges with color-coded CSS classes
- EfficiencyPanel handles efficiency bonuses per skill

**How items are structured:**
- defaults.json has: materials[], craftables[], resources[], recipes[], resourceRecipes[], resourceGathering[], allItems[], efficiencyItems[]
- New construction items need entries in resourceRecipes[] (recipes) and potentially resourceGathering[] (raw materials)
- Market prices are fetched via refresh-market-prices.ts script

**Equipment vendor prices:**
- 336 equipment items stored in allItems[] with hashedId, name, type, vendorPrice
- No quality tier stored -- need to inspect via API to get updated vendor prices
- Top vendor prices range from 2000g (mythical) down to lower tiers

### Phases Created: 4 task tickets

1. **imp-ul7i** - Add 'construction' to type system and UI (type definition + CSS)
2. **imp-4b4f** - Fetch construction items from API into defaults.json (discovery script)
3. **imp-xvuy** - Refresh equipment vendor prices (all 336 equipment items)
4. **imp-57oz** - Run market price refresh for new construction items

### Dependencies
- Phase 2 depends on Phase 1 (need valid type before adding data)
- Phase 4 depends on Phase 2 and Phase 3 (refresh after all data is added)
- Phase 3 is independent of Phases 1-2 (can run in parallel)

### Risks
- Construction skill may have unique item types or materials we haven't seen before -- discovery script needs to handle unexpected patterns
- API rate limit (20 req/min) means equipment vendor refresh takes ~17 minutes
- Construction items may not have market data yet if the skill is very new (low-confidence items)

**2026-03-23T12:18:15Z**

Implementation complete.

Files modified:
- src/types/index.ts - Added 'construction' to ResourceSkill union type
- src/components/ResourceTable.vue - Added 'Build' short label and yellow CSS badge (.skill-construction)
- src/data/defaults.json - Added construction data and refreshed equipment vendor prices
- scripts/refresh-vendor-prices.ts - New script to refresh mythic/legendary equipment vendor prices

Construction data added to defaults.json:
- resourceGathering: Clay (50s, 48g market), Sand (50s, 39g market), Limestone (50s, 17.6g market)
- resourceRecipes: 9 recipes (Weak Plank, Brick, Iron Fitting, Weak Beam, Glass, Robust Plank, Robust Beam, Strong Plank, Strong Beam)
- resources: 12 new entries for market price syncing

Equipment vendor prices refreshed:
- 179 mythical and legendary equipment items updated (e.g. Excalibur 2000->10,000,000, Corruption 2000->10,000,000)

Market prices refreshed:
- Construction gathering items (Clay, Sand, Limestone) populated from IdleMMO market API
- Construction recipe outputs (8 of 9 have market data) populated

Tests: JSON validation passes, TypeScript pre-existing errors only (not from our changes)

Ready for review.

**2026-03-23T12:21:31Z**

## Code Review: NEEDS FIXES

**Files reviewed:**
- src/types/index.ts -- added 'construction' to ResourceSkill union
- src/components/ResourceTable.vue -- added short label and CSS badge
- src/data/defaults.json -- construction data (3 gathering, 9 recipes, 12 resources) + 179 vendor price updates
- scripts/refresh-vendor-prices.ts -- new script

**TypeScript:** PASS (vue-tsc --noEmit clean)
**ESLint:** PASS (no output)
**Build:** PASS (vite build succeeds)

---

### Issues Found

#### 1. [Functional Bug] Iron Fitting recipe uses Iron Bar which is not in resourceGathering
**File:** src/data/defaults.json
**Problem:** The Iron Fitting recipe lists Iron Bar as a material (quantity: 3). Iron Bar is a smelting recipe output (in resourceRecipes[]) but is NOT in resourceGathering[]. The rawResourcePriceMap (useDataProvider.ts:436-451) only resolves prices from resourceGathering entries. This means:
- **Buy All mode**: Iron Bar price resolves to 0, so Iron Fitting cost is underreported (should be ~3x Iron Bar market price)
- **Gather / Gather All modes**: Iron Bar gather time resolves to 0 (gatherTimeMap only has resourceGathering items), so those modes undercount time

This is the first cross-recipe material reference in the codebase (no other recipe uses another recipe's output as a material).

**Suggestion:** Either:
(a) Add Iron Bar to resourceGathering[] as a pseudo-gather entry (with its market price, and timeSeconds = 0 or its smelting time), so rawResourcePriceMap and gatherTimeMap can resolve it. This is the simplest fix.
(b) Or expand rawResourcePriceMap to also include resourceRecipe outputs. This is more correct but a larger change.

#### 2. [Data] Strong Beam has currentPrice = 0 and marketPrice = 0, missing lastSaleAt/weeklySalesVolume
**File:** src/data/defaults.json (resourceRecipes and resources entries for Strong Beam)
**Problem:** Strong Beam (hashedId: GXBy7a4Lb00eN0Pw6Vdg) has no market data. Its resource entry also lacks lastSaleAt and weeklySalesVolume. This is likely because the item has no sales history on the market.
**Suggestion:** This is acceptable if the item genuinely has no market history, but it should be flagged as a low-confidence item. Verify that the low-confidence toggle (imp-0wtn feature) correctly catches this case -- a recipe with currentPrice=0 and no lastSaleAt should be filtered by the toggle. No code change needed if the toggle handles it, but worth confirming.

---

### Items Verified (No Issues)

- **Type correctness:** 'construction' added cleanly to ResourceSkill union type. All downstream usage (EfficiencyPanel, ResourceTable) uses the type dynamically via maps/computed, so no additional type changes needed.
- **Pattern compliance:** Construction resourceGathering entries match existing patterns (same fields: name, timeSeconds, baseCost, vendorValue, marketPrice, hashedId, skill). Construction resourceRecipes match existing smelting/cooking patterns. Resource entries follow the same id/name/marketPrice/vendorValue/hashedId scheme.
- **HashedId consistency:** All 12 construction items have consistent hashedIds across resourceGathering/resourceRecipes and resources[].
- **Resource ID uniqueness:** All 19 resource IDs (res-1 through res-19) are unique.
- **CSS badge:** .skill-construction uses yellow (rgba(234, 179, 8)) which is distinct from all other skill colors (red=smelting, orange=cooking, green=woodcutting, gray=mining, blue=fishing).
- **Short label:** 'Build' for construction is consistent in style with other labels (Smelt, Cook, WC, Mine, Fish).
- **Vendor prices:** Range from 150,000 to 10,000,000 gold for mythical/legendary equipment. Two items at 10M cap (Excalibur, Corruption). Distribution looks reasonable.
- **refresh-vendor-prices.ts:** Well-structured script with proper error handling, rate limit awareness, dry-run mode, and CLI flags. Follows the pattern of refresh-market-prices.ts.

---

**Summary:** Issue #1 (Iron Bar not in rawResourcePriceMap) is a functional bug causing incorrect profit calculations for Iron Fitting. Must be fixed before merging. Issue #2 is informational -- verify that it is handled by the existing low-confidence feature.

**2026-03-23T12:22:54Z**

Bug fix task started. Root cause identified: rawResourcePriceMap in useDataProvider.ts only reads from resourceGathering[], but Iron Fitting's material Iron Bar only exists in resourceRecipes[]. Fix approach: expand rawResourcePriceMap to also seed prices from resourceRecipes[].currentPrice entries, so any recipe output used as a material in another recipe will resolve correctly. Writing failing test first.

**2026-03-23T12:23:30Z**

Failing test created: src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts - 3 tests fail confirming the bug. baseCost=0 when it should be 84g (Iron Bar 28g * 3). Now implementing fix in rawResourcePriceMap.

**2026-03-23T12:24:13Z**

Bug fixed.

Root cause: rawResourcePriceMap in useDataProvider.ts only seeded prices from resourceGathering[]. Iron Bar (a smelting recipe output in resourceRecipes[]) was not in resourceGathering[], so its price resolved to 0 when used as a material in the Iron Fitting construction recipe.

Fix: Expanded rawResourcePriceMap to also seed from resourceRecipes[] outputs (at lower priority than resourceGathering entries, which override them if a name collision occurs). User overrides remain highest priority. This correctly handles any future cross-recipe material references without requiring data hacks.

Files modified:
- src/composables/useDataProvider.ts (rawResourcePriceMap: seed from resourceRecipes first, then resourceGathering, then user overrides)
- src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts (new regression test)

Tests: All passing (678/679, 1 intentionally skipped). Iron Fitting baseCost now correctly = Iron Bar currentPrice (28g) * 3 = 84g instead of 0.

**2026-03-23T13:56:41Z**

User Review: Perfect - work approved

**2026-03-24T08:15:06Z**

User reported Iron Fitting bug: all 3 modes show same items/hr. Root cause: multi-level recipe dependencies not recursively resolved. Iron Fitting needs 3x Iron Bar, which is itself a smelting recipe (Iron Ore + Coal). Modes: Buy All = buy iron bars (craft time only), Gather = gather all except coal (mine ore + smelt + craft), Gather All = gather everything including coal (mine ore + mine coal + smelt + craft).

**2026-03-24T08:16:18Z**

## Iteration: Recursive Recipe Resolution Bug

### Root Cause Analysis

The `resourceGatheringFromRecipes` computed (useDataProvider.ts:508-594) seeds `gatherTimeMap` from both `resourceRecipes` and `resourceGathering`, but only looks up ONE level. When a recipe material is itself a recipe (e.g., Iron Fitting -> Iron Bar -> Iron Ore + Coal), the code adds Iron Bar's own craft time (20.9s) but NOT the gather times for Iron Bar's raw materials (Iron Ore 20.9s, Coal 10.9s).

### Current Wrong Values for Iron Fitting

- Buy All: time=115s, baseCost=84g -- CORRECT (just buy Iron Bars)
- Gather: time=177.7s, baseCost=0 -- WRONG (should be 240.4s, baseCost=16.8g)
- Gather All: time=177.7s, baseCost=0 -- WRONG (should be 273.1s, baseCost=0)

### Expected Correct Values

**Buy All**: time = 115s (craft only), baseCost = 3 * 28g = 84g
**Gather (except coal)**: 
  - time = 115s (craft) + 3 * [20.9s (smelt Iron Bar) + 20.9s (mine Iron Ore)] = 240.4s
  - baseCost = 3 * 5.6g (buy Coal at market) = 16.8g
**Gather All**:
  - time = 115s (craft) + 3 * [20.9s (smelt) + 20.9s (mine Iron Ore) + 10.9s (mine Coal)] = 273.1s
  - baseCost = 0g (gather everything)

### Scope

Currently only Iron Fitting has a cross-recipe dependency, but the fix must handle arbitrary depth for future-proofing.

### Key Data Points
- Iron Bar: smelting recipe, 20.9s, materials: Iron Ore (1x) + Coal (1x)
- Iron Ore: mining, 20.9s, baseCost 0
- Coal: mining, 10.9s, baseCost 0
- Iron Fitting: construction recipe, 115s, materials: Iron Bar (3x)

**2026-03-24T08:20:09Z**

Recursive recipe resolution complete.

Files modified:
- src/composables/useDataProvider.ts - Replaced flat gatherTimeMap lookup with resolveMaterial() recursive function. Handles: raw gathered resources (leaf), sub-recipes (recursive), coal exclusion at all levels, cycle detection via visited set.
- src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts - Updated test suite with correct expected values and expanded coverage (11 tests).

Iron Fitting now computes correctly:
- Buy All: 115s, baseCost=84g (3x Iron Bar @ 28g)
- Gather: 240.4s, baseCost=16.8g (3x Coal @ 5.6g bought, ore mined)
- Gather All: 273.1s, baseCost=0g (everything gathered)

Tests: All passing (685/685, 1 skipped)

**2026-03-24T08:21:27Z**

## Code Review: NEEDS MINOR FIXES

Files reviewed:
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts (lines 508-633)
- /home/felix/idle-mmo-profiter/src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts

### Tests: PASS (685/685 passed, 1 skipped)
### ESLint: FAIL (2 errors in test file)

---

### Logic Review: CORRECT

The recursive resolveMaterial() function correctly handles:
1. Coal exclusion at all recursion levels (excludeCoal passed through recursive calls)
2. Cycle detection via visited Set with proper copy-per-branch semantics
3. Three resolution paths: coal special case -> raw gathered resource (leaf) -> sub-recipe (recursive) -> unknown fallback
4. Correct priority: raw gathered resources checked before recipeMap, so a material in both maps resolves as a leaf (correct behavior)
5. All 3 modes compute correctly for Iron Fitting:
   - Buy All: 115s craft, baseCost = 3 * Iron Bar market price
   - Gather: 115 + 3*(20.9+20.9) = 240.4s, baseCost = 3 * Coal market price
   - Gather All: 115 + 3*(20.9+20.9+10.9) = 273.1s, baseCost = 0

Test coverage is thorough: 11 tests covering prerequisite data checks, all 3 modes (time + baseCost), and ordering invariants.

No regressions detected.

---

### Issues Found

#### 1. [Lint] Non-null assertion on optional chain in test file
**File:** src/tests/calculators/iron-fitting-cross-recipe-bug.test.ts
**Lines:** 94, 118
**Problem:** Using `!.` after `?.` violates @typescript-eslint/no-non-null-asserted-optional-chain rule.
**Suggestion:** Replace with a standalone expect + early assertion pattern:
```
// Line 94: instead of ironBarRecipe?.currentPrice with !
const ironBarRecipe = defaultData.resourceRecipes?.find((r) => r.name === 'Iron Bar')
expect(ironBarRecipe).toBeDefined()
const expectedCost = ironBarRecipe!.currentPrice * 3
// Already correct pattern on line 95 -- but line 94 likely has the optional chain issue
```
Verify and fix the exact usage at lines 94 and 118 to remove the optional-chain-then-non-null pattern.

---

### Items Verified (No Issues)

- Recursive resolution logic is correct and handles arbitrary depth
- Coal exclusion propagates through all recursion levels (not just top-level materials)
- Cycle detection prevents infinite loops on circular recipe dependencies
- The visited set is initialized with the current recipe name on each mode call, preventing self-referencing
- New Set copy per branch ensures tree traversal correctness
- Unknown materials fall back to zero (acceptable silent behavior)
- All existing tests continue to pass (no regressions)
- Code is well-documented with clear JSDoc on resolveMaterial()

**2026-03-24T08:27:11Z**

User Review: Perfect - approved
