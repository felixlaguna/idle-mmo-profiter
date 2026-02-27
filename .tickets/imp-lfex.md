---
id: imp-lfex
status: closed
deps: [imp-k9eq]
links: []
created: 2026-02-26T22:14:52Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-a363
---
# Phase 4: UI -- Dual profitability display in Potion Table

Update the PotionTable component to display dual profitability for potions that have recipe costs.

## Files to modify:
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue

## Tasks:
1. For potions where hasRecipeCost is true, display both profit values:
   - Primary row shows profit WITHOUT recipe cost (the standard view)
   - Show recipe cost info in expanded details or as additional columns
   - Display 'Profit (w/ recipe)' and 'Profit/hr (w/ recipe)' columns or sub-rows

2. Design options (recommend Option A):
   Option A - Additional columns:
   - Add 'Recipe Cost/Craft' column (shows amortized cost per craft)
   - Add 'Profit (w/ recipe)' column
   - Add 'Profit/hr (w/ recipe)' column
   - Columns only visible when at least one potion has recipe cost data
   
   Option B - Expanded row enhancement:
   - Show dual profitability in the expanded material breakdown section
   - Add a 'Recipe Cost' section showing tradable recipe price, uses, and amortized cost

3. Update sorting to support new columns (if Option A)

4. Update heatmap ranges to account for new profit columns

5. Show a visual indicator (icon/badge) on potions that have recipe cost data

## Responsive Considerations:
- On mobile, the additional columns may be too wide
- Consider showing recipe cost info only in expanded view on small screens

## Acceptance Criteria

- Potions with recipe costs show both profitability figures
- UI is clear about which profit includes recipe cost
- Sorting works on new columns
- Heatmap colors correctly applied
- Responsive layout works on mobile


## Notes

**2026-02-26T22:53:46Z**

Phase 4 implementation complete. Added dual profitability display to PotionTable.vue:

Features implemented:
1. Tooltip on profit and profit/hr columns when hasRecipeCost is true
2. Tooltip shows:
   - Profit without recipe cost (primary value)
   - Profit with recipe cost (including amortized cost)
   - Recipe name, market price, uses count, and cost per craft
3. Visual indicator (ⓡ symbol) on potions with recipe costs
4. Mobile-friendly: tooltips hidden on mobile, recipe cost info shown in expanded view instead
5. Recipe cost section added to expanded material breakdown with all dual profitability details

Files modified:
- /home/felix/idle-mmo-profiter/src/components/PotionTable.vue

Build: Successful (npm run build passes)
