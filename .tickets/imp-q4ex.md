---
id: imp-q4ex
status: closed
deps: [imp-wk4d]
links: []
created: 2026-02-25T18:31:56Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dv3t
---
# Extract default data JSON from Excel spreadsheet

Create src/data/defaults.json containing all hardcoded game data extracted from Idlemmo.xlsx:

Market sheet (4 separate lists in columns A-R):
- 11 materials with names and market prices (col B-C)
- 6 potions with names and prices (col F-G)
- 7 resources with names and market prices (col J-K)
- 345 recipes with names, prices, and drop chances (col N-Q, some chances are formulas like 0.2*0.25)

Dungeon sheet:
- 18 dungeons (rows 2-19): name, run cost, time (seconds), number of drops
- Each dungeon's drops: recipe names and their expected values (computed from Market sheet references)
- MF settings defaults: Streak=10, Dung=13, Item=3, Bonus=10

Potions sheet:
- 6 potions: name, craft time, material quantities, vial cost, current sell price
- Material references back to Market sheet materials

Profit sheet:
- Resources: name, gather time, cost, vendor value, market price reference
- Multi-step chains: raw -> cooked, ore -> bar

All formula values should be pre-computed as static numbers in the JSON.
Recipe drop chances that are formulas (e.g., =0.2*0.25) must be evaluated to their numeric result (e.g., 0.05).

## Acceptance Criteria

defaults.json is valid JSON, all 345 recipes present, all 18 dungeons present, all computed values are numbers (no formulas)


## Notes

**2026-02-25T18:47:57Z**

Excel extraction complete. Created scripts/generate-defaults-json.js that:
- Reads Idlemmo.xlsx using xlsx library
- Extracts all 4 sheets (Market, Dungeon, Potions, Profit)
- Generates src/data/defaults.json with all data

Data extracted:
- 11 materials (columns B-C from Market sheet)
- 6 potions (columns F-G from Market sheet)
- 7 resources (columns J-K from Market sheet)
- 345 recipes (columns N-Q from Market sheet) - all with computed numeric values
- 18 dungeons with drop tables (Dungeon sheet)
- 6 potion crafts (Potions sheet)
- 12 resource gathering activities (Profit sheet)
- MF defaults: Streak=10, Dung=13, Item=3, Bonus=10
- Market tax: 12%

Created src/utils/validateData.ts to validate JSON matches TypeScript types.
All type checks passing. Build successful.
