---
id: imp-zuxx
status: closed
deps: [imp-zqhx]
links: []
created: 2026-02-25T18:34:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-5r5u
---
# Build dungeon detail table with drop breakdowns

Create dungeon-specific detail view:

- Table of all 18 dungeons with columns:
  - Dungeon Name, Run Cost, Time (formatted as Xh Xm), # Drops, Total Profit, Profit/h
- Expandable rows: click to show drop breakdown table:
  - Drop Name, Price (editable), Drop Chance (%), Expected Value, % of Total Profit
  - Drops sorted by expected value descending
- MF settings panel at top of section:
  - 4 editable fields: Streak, Dungeon, Item, Bonus
  - Shows Total MF and the multiplier effect
  - Changes trigger live recalculation of all dungeon profits
- Run cost and time are editable per dungeon
- Color gradient on profit/h column (green=high, red=low/negative)

## Acceptance Criteria

All 18 dungeons displayed with expandable drops, MF editing recalculates in real-time


## Notes

**2026-02-25T19:13:59Z**

Dungeon detail table complete:
- Created DungeonTable.vue component
- Shows all 18 dungeons with: Name, Run Cost, Time, Expected Value, Profit, Profit/hr
- Expandable rows showing drop breakdown (item name, price, chance, MF-adjusted value)
- Inline editing for run cost and time using EditableValue component
- Sort by any column
- Color-coded profit (green for positive, red for negative)
- Integrated into App.vue 'Dungeons' tab
