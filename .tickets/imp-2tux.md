---
id: imp-2tux
status: closed
deps: [imp-n0vk]
links: []
created: 2026-04-15T15:48:25Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-aon1
---
# Phase 8: Delete adapter layer and old types, final cleanup

Final cleanup: remove the adapter layer (no longer needed after Phase 7), delete old type interfaces, remove dead code.

## 8A. Delete adapter file
- DELETE: src/data/adapters.ts

## 8B. Remove old type interfaces from src/types/index.ts
Delete (if no longer referenced):
- Material interface
- Craftable interface
- Resource interface
- Recipe interface (may need to keep a simplified version for dungeon drops)
- CraftableRecipe interface
- ResourceRecipe interface
- ResourceGather interface

Keep:
- MasterItem and related interfaces
- Dungeon, DungeonDrop (dungeons are separate entities)
- EfficiencyItem, EfficiencyEffect
- AppSettings, MagicFindSettings
- CharacterStore and related types
- ProfitResult, ActivityType
- Calculator result types

## 8C. Update DefaultData interface

Final form:
```typescript
export interface DefaultData {
  masterItems: MasterItem[]
  dungeons: Dungeon[]
  efficiencyItems: EfficiencyItem[]
  magicFindDefaults: MagicFindSettings
  marketTaxRate: number
}
```

## 8D. Dead code sweep
- Remove any unused imports
- Remove any commented-out old code
- Run lint to catch issues

## 8E. Update documentation
- Update MEMORY.md with new architecture
- Add JSDoc comments to MasterItem describing the unified model

## Files to modify/delete
- DELETE: src/data/adapters.ts
- MODIFY: src/types/index.ts
- MODIFY: Any file still importing old types
- MODIFY: .claude MEMORY.md

## Acceptance Criteria

1. No adapter code remains
2. Old type interfaces removed
3. Lint passes with no unused imports
4. All tests pass
5. Documentation updated
6. Clean codebase with single data model


## Notes

**2026-04-15T17:15:44Z**

Implementation complete.

Files deleted:
- src/data/adapters.ts — adapter layer removed
- src/tests/data/adapters.test.ts — adapter tests removed

Files modified:
- src/types/index.ts — DefaultData now has only: masterItems, dungeons, efficiencyItems, magicFindDefaults, marketTaxRate
- src/composables/useDataProvider.ts — added RuntimeData internal type (extends DefaultData with derived arrays); changed cast from DefaultData to RuntimeData
- src/api/mock.ts — removed toMaterials/toCraftables/toResources adapter imports; MockProvider/ApiProvider now work directly with MasterItem[]; added getMasterItemType helper
- src/tests/composables/useDataProvider.test.ts — removed adapter imports; rewrote 'masterItems path equivalence' describe block to test MasterItem fields directly
- src/tests/data/great-white-shark.test.ts — replaced toResources adapter call with direct masterItems lookup
- src/tests/mock-provider.test.ts — updated getCurrentPrices tests to check masterItems instead of old materials/craftables arrays

Tests: All 889 passing (48 test files)
