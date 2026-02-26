---
id: imp-90r5
status: closed
deps: [imp-dv3t]
links: []
created: 2026-02-25T18:31:02Z
type: epic
priority: 2
assignee: Félix Laguna Teno
parent: imp-jug7
---
# Epic 4: Profit Calculation Engine

Port the Excel spreadsheet profit calculation logic to TypeScript. This is the core business logic of the app.

Three profit calculation categories (from the Excel):

1. DUNGEON PROFIT (Dungeon sheet):
   - 18 dungeons, each with: name, run cost (gold), time (seconds), number of drops
   - Each drop is a recipe from the Market sheet with a drop chance
   - Expected value per drop = recipe_price * chance * (1 + total_MF/100)
   - Dungeon profit = SUM(all drop expected values) - run_cost
   - Dungeon profit/h = profit / (time_seconds / 3600)
   - MF (Magic Find) = sum of MF Streak + MF Dung + MF Item + MF Bonus (configurable)

2. POTION CRAFTING PROFIT (Potions sheet):
   - 6+ potions with: craft time, material quantities, material costs (from Market), vial cost
   - Total cost = sum of (mat_qty * mat_price) + vial_cost
   - Min sell price = total_cost + 12% tax
   - Benefit = current_market_price - min_sell_price
   - Benefit/h = benefit / (craft_time / 3600)

3. RESOURCE GATHERING PROFIT (Profit sheet):
   - Resources: Coal, Stingray, Great White Shark, Mystic Ore, etc.
   - Each has: gather time, cost, vendor value, market value
   - Vendor benefit = vendor_value - cost
   - Market benefit = (market_price - 12% tax) - cost
   - Compares vendor vs market, picks the better option
   - Handles multi-step chains (e.g., fish + cook + sell, mine ore + smelt bar + sell)

Output: A unified sorted list of all activities ranked by profit/hour, with the #1 most profitable action highlighted.

