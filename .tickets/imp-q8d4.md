---
id: imp-q8d4
status: open
deps: [imp-760v]
links: []
created: 2026-02-25T18:32:48Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-64ql
---
# Build inline editing for all price/value fields

Create reusable inline edit component:

- Click on any price/value cell to enter edit mode
- Shows input field with current value pre-filled
- Enter to save, Escape to cancel
- Saved values go to localStorage as overrides
- Visual indicator for overridden values (e.g., blue text or small icon)
- Right-click or button to reset individual value to default/API value
- Apply to all editable fields:
  - Material prices (11 items)
  - Potion sell prices (6 items)
  - Resource market prices (7 items)
  - Recipe prices (345 items - in dungeon detail tables)
  - MF settings (4 values)
  - Dungeon run costs and times (18 dungeons)
  - Potion craft times and material quantities
  - Resource gather times, costs, vendor values
  - Market tax rate (default 12%)
- Validation: numbers only, minimum 0, max reasonable limits

## Acceptance Criteria

All values are editable inline, persisted to localStorage, show override indicator

