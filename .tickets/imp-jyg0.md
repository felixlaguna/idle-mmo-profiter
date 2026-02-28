---
id: imp-jyg0
status: closed
deps: []
links: []
created: 2026-02-25T18:33:29Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-90r5
---
# Implement dungeon profit calculator

Create src/calc/dungeon.ts:

Port the Dungeon sheet logic from the Excel:

For each dungeon (18 total):
1. Get the dungeon's drop list (recipe names from the Market sheet)
2. For each drop:
   - Look up recipe price from Market sheet col O (Price)
   - Look up drop chance from Market sheet col Q (Chance)
   - Some chances are computed per-dungeon using formulas like =R39/100 (i.e., col R values / 100)
   - Expected value = price * chance * (1 + totalMF/100)
3. Dungeon profit = SUM(all drop expected values) - run_cost
4. Dungeon profit/h = profit / (time_seconds / 3600)

MF calculation:
- totalMF = MF_Streak + MF_Dung + MF_Item + MF_Bonus (from Dungeon sheet B23:B26)
- Default: 10 + 13 + 3 + 10 = 36
- This is stored in B27 as =SUM(B22:B26) (note: B22 seems empty, actual sum is B23:B26)

The offset system in col B:
- Dungeon 1 offset = 1 (hardcoded)
- Each subsequent dungeon offset = previous_offset + previous_dungeon's_num_drops
- This maps each dungeon's drops to rows in the Market recipe list

Function: calculateDungeonProfits(dungeons, recipes, mfSettings, priceOverrides) -> DungeonProfitResult[]
Each result: { name, runCost, timeSeconds, drops: [{name, price, chance, expectedValue}], totalProfit, profitPerHour }

## Acceptance Criteria

All 18 dungeons return correct profit values matching the Excel computed values


## Notes

**2026-02-28T23:39:01Z**

Verified: Fully implemented in src/calculators/dungeonCalculator.ts with MF settings, drop chances, profit/hour. Closing.
