---
id: imp-9kjk
status: closed
deps: [imp-zi3u, imp-qxbb]
links: []
created: 2026-03-04T17:39:20Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-mshp
---
# Phase 4: Integration - wire MagicFindPanel into Dungeons tab and sync MF state

## Goal
Wire the MagicFindPanel and DungeonSelector into the Dungeons tab. Ensure dungeon MF auto-syncs to the magicFind.dungeon value used by dungeonCalculator, and remove the now-redundant MF Dungeon field from SettingsPanel.

## Files to Modify

### MODIFY: src/components/DungeonTable.vue
- Import and render MagicFindPanel at the top of the component, ABOVE the existing controls-bar
- Add local ref for dungeon selector open state
- Handle 'open-dungeon-selector' event from MagicFindPanel to open DungeonSelector
- Render DungeonSelector component (controlled by open state ref)
- Layout: MagicFindPanel sits above controls-bar, not inside it

### MODIFY: src/App.vue
- The magicFind.dungeon value is already reactive via useStorage. The composable from Phase 1 writes to it, so profit recalculation happens automatically. No changes needed in App.vue for data flow.
- However, verify that the watch on magicFind triggers recalculation of dungeonProfits computed. This should work because useStorage returns the same ref singleton.

### MODIFY: src/components/SettingsPanel.vue
- Remove the 'MF Dungeon' EditableValue from the Magic Find Settings section
- Add a note/label in its place: 'Dungeon MF is configured in the Dungeons tab' (or just remove the row entirely)
- Keep streak, item, bonus editable in settings (they serve as a secondary editing location)

### MODIFY: src/composables/useMagicFindConfig.ts (from Phase 1)
- Ensure the composable writes completedDungeons.size back to the magicFind.dungeon field
- Use a watch() on completedDungeons to sync: watch(completedDungeons, (set) => { magicFind.value.dungeon = set.size })
- This ensures the existing dungeonCalculator gets the updated MF value without any changes to the calculator

## Key Data Flow
1. User toggles dungeons in DungeonSelector
2. useMagicFindConfig.completedDungeons updates (Set in memory, array in localStorage)
3. watch() syncs completedDungeons.size -> magicFind.value.dungeon (in useStorage)
4. useStorage auto-persists magicFind to localStorage
5. App.vue's magicFind ref reactively triggers dungeonProfits recalculation
6. DungeonTable receives updated dungeonProfits as prop

## Important: Singleton Ref Sharing
Both App.vue and useMagicFindConfig use useStorage('magicFind', ...). Because useStorage creates refs keyed by storage key, they must share the same underlying ref. Verify this is the case -- if useStorage creates a new ref each call, we need to make it singleton (or the composable needs to accept the magicFind ref as input).

**CRITICAL**: Looking at useStorage.ts, it creates a NEW ref on each call. This means App.vue's magicFind ref and useMagicFindConfig's magicFind ref would be SEPARATE. Two approaches:
- Option A: Make useMagicFindConfig accept the magicFind ref as a parameter from App.vue (prop drilling)
- Option B: Make useStorage singleton per key (like useActivityFilters uses module-level state)
- Option C: Have useMagicFindConfig write directly to localStorage and trigger a custom event, then App.vue listens

**Recommended: Option B** - Refactor useStorage to cache refs by key at module level, so all callers get the same reactive ref. This is a small change and benefits the entire app.

### MODIFY: src/composables/useStorage.ts (if Option B chosen)
- Add a module-level Map<string, Ref> cache
- In useStorage(), check if a ref already exists for this key; if so, return it
- This ensures all callers sharing the same key get the same reactive ref

## Acceptance Criteria
- [ ] MagicFindPanel renders at top of Dungeons tab
- [ ] DungeonSelector opens from the dungeon button
- [ ] Changing completed dungeons updates dungeon MF value
- [ ] Dungeon MF flows through to profit calculations (dungeonProfits updates)
- [ ] MF Dungeon field removed from SettingsPanel (or marked as configured elsewhere)
- [ ] Settings panel streak/item/bonus changes still work correctly
- [ ] useStorage refs are shared (singleton per key) so state stays in sync

## Acceptance Criteria

MagicFindPanel in Dungeons tab, DungeonSelector wired, MF syncs to calculator, SettingsPanel updated


## Notes

**2026-03-04T17:50:27Z**

Starting Phase 4 integration. First will fix useStorage singleton issue, then wire MagicFindPanel into DungeonTable, then update SettingsPanel.

**2026-03-04T17:51:35Z**

Integration complete. Modified files:
- src/composables/useStorage.ts: Added singleton cache to ensure all callers share same ref per key
- src/components/DungeonTable.vue: Added MagicFindPanel and DungeonSelector, wired up event handler
- src/components/SettingsPanel.vue: Removed MF Dungeon field, added note pointing to Dungeons tab

Running tests to verify everything works.

**2026-03-04T17:52:17Z**

Phase 4 integration complete and verified.

Changes summary:
1. useStorage.ts: Added module-level cache (Map<string, Ref>) to implement singleton pattern per key
2. DungeonTable.vue: Imported MagicFindPanel and DungeonSelector, added modal state and event handler
3. SettingsPanel.vue: Removed MF Dungeon input field, added informational note

Data flow verification:
- useMagicFindConfig and App.vue now share the same magicFind ref via useStorage singleton
- Composable watch syncs completedDungeons.size -> magicFind.dungeon automatically (lines 68-76)
- Changes to MF settings in Dungeons tab propagate to profit calculations reactively
- All 541 tests passing
- App builds and runs successfully in Docker

Ready for Phase 5 (tests).
