---
id: imp-ibip
status: closed
deps: [imp-as1f]
links: []
created: 2026-02-26T19:51:23Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mpxc
---
# Phase 2: Add Export JSON button to the Settings panel (Backup & Restore section)

Add an 'Export defaults.json' button to the SettingsPanel.vue component, in the existing 'Backup & Restore' section alongside the existing 'Export Settings' and 'Import Settings' buttons.

## What to build
1. Add an 'Export defaults.json' button in /home/felix/idle-mmo-profiter/src/components/SettingsPanel.vue, inside the 'Backup & Restore' section (lines ~118-135 in current code)
2. Import and call dataProvider.exportAsDefaultsJson() to get the merged JSON string
3. Trigger a browser file download with filename 'defaults.json'
4. Show a success toast notification after export

## UI placement
The SettingsPanel.vue has a 'Backup & Restore' section (lines 118-135) that already contains:
  - 'Export Settings' button (exports localStorage settings only)
  - 'Import Settings' button

The new 'Export defaults.json' button goes in the same `.button-row` div, alongside those two existing buttons.

NOTE: The API key is managed by ApiKeyInput.vue which is rendered as the first section in SettingsPanel.vue. The export button lives in the same panel/page (SettingsPanel), NOT in MarketTable.vue. The SettingsPanel is not technically a modal -- it is a panel component -- but the user refers to it as "the same modal as the API key setting."

Button text: 'Export defaults.json'
The button should always be visible (no API key requirement -- it exports local data).

## Key files
- /home/felix/idle-mmo-profiter/src/components/SettingsPanel.vue -- add export button and handler in the Backup & Restore section
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts -- call exportAsDefaultsJson()
- /home/felix/idle-mmo-profiter/src/composables/useToast.ts -- show success toast (if available)

## Implementation notes
- Use the same file download pattern already used in SettingsPanel.vue (see handleExport which calls exportSettings()): create Blob, URL.createObjectURL, click hidden link, revoke URL. The useSettingsManager.ts exportSettings() function shows the exact pattern.
- The download filename should be 'defaults.json' (matching the name of src/data/defaults.json)
- The button does NOT need an API key -- it exports whatever data is currently loaded (defaults + any user overrides)
- Follow the existing btn-secondary styling already used for 'Export Settings' and 'Import Settings' buttons in SettingsPanel.vue
- This is DISTINCT from 'Export Settings' which only exports localStorage settings. This exports the full merged defaults.json with user overrides applied to it.
- MarketTable.vue should NOT be modified for this feature.

## Acceptance Criteria

- Export defaults.json button visible in SettingsPanel Backup & Restore section
- Clicking triggers a file download named 'defaults.json'
- Downloaded file contains all user overrides merged into the default data
- Success toast appears after export
- Button works without API key
- Button styling matches existing 'Export Settings' / 'Import Settings' buttons (btn-secondary)
- MarketTable.vue is NOT modified

## Notes

**2026-02-26T19:59:34Z**

Phase 2 complete. Added 'Export defaults.json' button to SettingsPanel.vue in the Backup & Restore section.

Key implementation details:
- Button placed alongside existing Export/Import Settings buttons
- Uses same btn-secondary styling for visual consistency
- Calls dataProvider.exportAsDefaultsJson() to get merged JSON
- Downloads file as 'defaults.json'
- Shows success toast notification after export
- No API key required (exports local data)

Files modified:
- /home/felix/idle-mmo-profiter/src/components/SettingsPanel.vue

Build status: All TypeScript checks pass
