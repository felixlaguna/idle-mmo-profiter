---
id: imp-d6fm
status: closed
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


## Notes

**2026-02-25T19:17:29Z**

Settings panel integration complete:
- Settings panel already integrated as a modal in App.vue
- Gear icon in top bar opens/closes the settings modal
- MF settings changes automatically recalculate all profits in real-time (using reactive refs)
- Modal overlay with click-outside-to-close functionality
- Close button in modal header
- Settings panel uses existing SettingsPanel.vue component
- All settings (MF, tax rate, API key) are reactive and persist to localStorage
- Build and lint both pass successfully
