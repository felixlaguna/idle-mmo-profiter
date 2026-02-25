---
id: imp-d6fm
status: open
deps: [imp-zqhx]
links: []
created: 2026-02-25T18:34:04Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-5r5u
---
# Build settings panel

Create settings panel (can be sidebar, modal, or dedicated section):

Sections:
1. API Configuration:
   - API key input with show/hide toggle
   - Validate & Save button
   - Key status (valid/invalid, scopes, rate limit)
   - Rate limit gauge (remaining/total requests)
   - Clear key button
   
2. Data Management:
   - Last refresh timestamp
   - Manual refresh button
   - Auto-refresh toggle and interval selector
   - Export settings (JSON download)
   - Import settings (file upload)
   - Reset to defaults button
   - Reset prices to API values button

3. Global Parameters:
   - Market tax rate (default 12%, editable)
   - MF settings (Streak, Dungeon, Item, Bonus)

4. About:
   - Version info
   - Data source links
   - Credits

## Acceptance Criteria

Settings panel allows full configuration, API key management, import/export

