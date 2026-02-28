---
id: imp-ivei
status: closed
deps: [imp-n8d2]
links: []
created: 2026-02-27T22:12:06Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-259e
tags: [fix, data-provider]
---
# Fix: Make craftable IDs deterministic instead of timestamp+random based

## Fix Task: Deterministic Craftable IDs

### Problem
The craftableRecipes sync in `createDataProvider()` (lines 183-211 of `useDataProvider.ts`) generates craftable IDs using:
```
const id = \`craft-auto-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`
```

These IDs are non-deterministic -- they change every time the sync runs. This is the core structural issue that makes user overrides fragile:
- User sets a hashedId on a craftable with ID `craft-auto-1772226753831-a0hn`
- Override is stored in localStorage keyed to that ID
- If the sync re-runs and generates a NEW ID for the same craftable name, the override is orphaned

### Changes Required

**File: `/home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts`**

Replace the timestamp+random ID generation with a deterministic scheme based on the item name:

```typescript
// Instead of:
const id = \`craft-auto-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}\`

// Use a deterministic slug:
const id = \`craft-\${recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}\`
```

This ensures:
1. Same craftable always gets the same ID regardless of when sync runs
2. User overrides keyed to this ID survive app reloads, export/import cycles
3. The populate-hashed-ids.ts script results persist correctly

Apply the same fix to the `mat-auto-` ID generation on line 187.

Also apply to:
- `addCraftable()` function (line 743)
- `addMaterial()` function (line 723)

### Migration Consideration
Existing user overrides may be keyed to old `craft-auto-{timestamp}-{random}` IDs. Need a one-time migration that:
1. Reads current user overrides
2. For each craftable override with an old-format ID, finds the matching craftable by name
3. Re-keys the override to the new deterministic ID

### Acceptance Criteria
- [ ] Craftable IDs are deterministic and based on name
- [ ] Material IDs from auto-sync are also deterministic
- [ ] User overrides survive app reloads without ID mismatch
- [ ] One-time migration handles existing overrides with old IDs
- [ ] addCraftable() and addMaterial() also use deterministic IDs
- [ ] No duplicate IDs are generated for different items


## Notes

**2026-02-27T22:22:23Z**

Closed: Not needed. Per user feedback, the fix is to populate hashedId from the source recipe's producesItemHashedId during craftable generation, not to make IDs deterministic. The ID format doesn't matter because hashedId comes from recipe data, not user overrides.
