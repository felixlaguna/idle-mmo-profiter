---
id: imp-m64w
status: closed
deps: []
links: []
created: 2026-03-09T08:04:20Z
type: bug
priority: 2
assignee: Félix Laguna Teno
---
# Bug: Profit calculations not accounting for 12% market selling tax

Selling in the market has a 12% tax cost that should reduce profit. Buying has no tax. Currently profit calculations may not factor this in, leading to inflated profit numbers for resources and craftables.


## Notes

**2026-03-09T08:06:07Z**

## Scouter Analysis

### Tax Status by Calculator

**Resources (resourceCalculator.ts)** -- CORRECTLY taxed
- Line 70: marketAfterTax = resource.marketPrice * (1 - taxRate)
- taxRate passed from App.vue -> useProfitRanking -> calculateResourceProfits
- Both vendor and market profit paths handled (vendor sales have no tax, market sales do)

**Craftables (craftableCalculator.ts)** -- CORRECTLY taxed
- Line 220: sellAfterTax = craftable.currentPrice * (1 - taxRate)
- Line 217: minSellPrice = totalCost / (1 - taxRate) -- break-even correctly accounts for tax
- taxRate passed from App.vue -> useProfitRanking -> calculateCraftableProfits

**Recipe Pricing (useRecipePricing.ts)** -- CORRECTLY taxed
- Line 45: sellAfterTax = craft.currentPrice * (1 - taxRate)
- Untradable recipe price = uses * craftable_profit (already tax-adjusted)

**Dungeons (dungeonCalculator.ts)** -- BUG: TAX NOT APPLIED
- Line 76: expectedValue = recipe.price * recipe.chance * (1 + totalMF/100)
- recipe.price is the market price of tradable recipe drops
- When the player sells a recipe drop on the market, they pay 12% tax
- The function does NOT accept a taxRate parameter at all
- NUANCE: Untradable recipes already have tax baked into their computed price (via useRecipePricing), so only TRADABLE drops need the tax applied

### Affected Files
- src/calculators/dungeonCalculator.ts -- main bug location
- src/composables/useProfitRanking.ts -- needs to pass taxRate to dungeon calc
- src/App.vue -- needs to pass taxRate to direct dungeon calc call (line 140)
- src/tests/calculators/dungeonCalculator.test.ts -- needs test updates
- src/tests/calculators/stormbringer-bug.test.ts -- may need updates
- src/tests/composables/useMagicFindConfig.test.ts -- may need updates

### Impact
- All dungeon profit values are currently OVERSTATED by ~12% on tradable drops
- The profit ranking (profitRanker.ts) consumes dungeon results, so the Best Action recommendation may incorrectly favor dungeons over resources/craftables
- Untradable recipe drops are NOT affected (tax already baked in)

**2026-03-09T08:07:07Z**

## Planning Complete

### Finding
The 12% market tax IS correctly applied to Resources and Craftables, but is MISSING from Dungeon profit calculations. Dungeon tradable recipe drop expected values are overstated by ~12%.

### Root Cause
`calculateDungeonProfits()` in `dungeonCalculator.ts` does not accept or apply a `taxRate` parameter. The formula `expected_value = recipe.price * recipe.chance * (1 + totalMF/100)` uses the raw market price without deducting the 12% selling tax.

### Nuance: Untradable vs Tradable Drops
- **Tradable drops**: Use raw market price -> MUST apply tax (this is the bug)
- **Untradable drops**: Price is computed by `useRecipePricing` as `uses * craftable_profit`, where craftable_profit already accounts for tax -> MUST NOT apply tax again (would be double-counting)

### Phases Created: 3 task tickets
1. **imp-2fex** - Add taxRate to dungeonCalculator (core fix)
2. **imp-heis** - Wire taxRate through call sites (useProfitRanking, App.vue)
3. **imp-jeks** - Update all dungeon calculator tests

### Dependencies: linear (1 -> 2 -> 3)

### Risks
- **Test count**: Many existing dungeon tests (~30+) will need the taxRate parameter added. Expected values in assertions will change for tests with tradable drops.
- **Untradable double-tax**: Must be careful to check `recipe.isUntradable` before applying tax. The test suite must cover this explicitly.
- **No UI changes needed**: The DungeonTable and DungeonChart consume `DungeonProfitResult` which already has `totalProfit` and `profitPerHour` -- these will automatically reflect the corrected values.

Ready for user approval.

**2026-03-09T08:09:58Z**

User requested full audit of ALL profit calculations before implementing fixes. Pausing dungeon-only fix to verify Resources and Craftables are truly correct.

**2026-03-09T08:11:21Z**

Full audit completed: ALL profit calculations (resources, craftables, dungeons) already correctly apply the 12% market tax. No bug found. Tax is applied at sell price level before subtracting costs. Closing as not-a-bug.
