---
id: imp-z5uy
status: closed
deps: [imp-dun2]
links: []
created: 2026-03-04T19:33:37Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Phase 3: CharacterTracker Vue component

Create the main CharacterTracker.vue component that renders the full page content for the new tab.

## File: src/components/CharacterTracker.vue

### Layout (top to bottom)
1. **Character selector bar** - Horizontal bar with:
   - Dropdown or pill buttons to switch between characters
   - 'Add Character' button (opens inline name input)
   - Character name (editable via EditableValue pattern or inline rename)
   - Delete character button (with confirmation)

2. **Gold input** - Editable gold amount for active character
   - Uses existing number formatting (toLocaleString)
   - EditableValue component or simple input

3. **Inventory table** - Table showing current inventory items:
   - Columns: Item Name, Quantity, Unit Price (live from market), Total Value
   - Each row: quantity is editable (pending state shown visually)
   - Remove button per row
   - Pending changes highlighted (e.g., amber background or asterisk)
   - Empty state message when no items

4. **Add item section** - Autocomplete search input:
   - Searches across ALL items from useDataProvider (materials, craftables, resources, recipes)
   - User selects item -> enters quantity -> item appears in inventory table as pending
   - Search by item name, filtered as user types
   - Deduplicated: if item already in inventory, update quantity instead of adding duplicate

5. **Action bar** - Save / Discard buttons:
   - Save: calls saveSnapshot(), shows toast notification
   - Discard: calls discardChanges(), shows toast notification
   - Both buttons disabled when hasPendingChanges is false
   - Save button visually prominent (primary color), Discard is secondary

6. **Value summary card** - Shows:
   - Current gold amount
   - Inventory market value (sum of quantity * current price)
   - Total value (gold + inventory)
   - Format numbers with toLocaleString

7. **Value history chart** - Line chart using Chart.js (same pattern as PriceHistoryChart.vue):
   - X-axis: snapshot timestamps (formatted as date strings)
   - Y-axis: total value (gold + inventory at current market prices for each snapshot)
   - Uses Chart.js directly with canvas ref (NOT vue-chartjs wrapper, matching existing pattern)
   - Dark theme colors consistent with existing charts
   - Empty state when no history snapshots exist

### Styling
- Follow existing component styling conventions:
  - Use CSS custom properties from style.css (--bg-secondary, --border-color, --surface-*, etc.)
  - Scoped styles
  - Mobile responsive (max-width: 767px breakpoint)
  - Dark theme consistent with rest of app
- Table styling should match existing tables (CraftableTable, ResourceTable patterns)

### Data flow
- Uses useCharacterTracker() composable for all state management
- Uses useDataProvider() for item lookup and price resolution
- Creates priceResolver function that checks materialPriceMap, craftablePriceMap, resourcePriceMap, and recipe prices
- Uses useToast() for save/discard notifications

### Interaction notes
- Component should be lazy-loaded with defineAsyncComponent (matches Charts tab pattern)
- Item search should be debounced (300ms) to avoid excessive filtering on large item lists
- Quantity inputs should accept only positive integers

## Acceptance Criteria

Component renders correctly with all 7 sections. Character CRUD works. Bulk inventory editing with save/discard works. Chart renders history. Mobile responsive. Follows existing design system.


## Notes

**2026-03-04T19:40:01Z**

CharacterTracker.vue component created with:
- Character selector bar with pills + add/rename/delete
- Gold input with reactive sync
- Inventory table showing items with pending change highlighting
- Item search with autocomplete (debounced 300ms, max 20 results)
- Add item workflow with quantity prompt
- Save/Discard action bar (disabled when no pending changes)
- Value summary card (gold + inventory + total)
- Value history chart using Chart.js (line chart, historical prices)
- Mobile responsive (breakpoint at 767px)
- All 7 sections from spec implemented
