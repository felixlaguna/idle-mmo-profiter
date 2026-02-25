---
id: imp-xjsb
status: closed
deps: []
links: []
created: 2026-02-25T22:17:56Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-6z9j
---
# Phase 1: Make useDataProvider a singleton for shared reactivity

## Problem
useDataProvider() creates fresh refs each call. The Market tab needs to share the same reactive state as App.vue so that edits in the Market tab trigger recalculations in all other tabs.

## Solution
Convert useDataProvider to a singleton pattern using module-level state. The refs and computed properties should be created once at module scope, and useDataProvider() should return the same references every time.

## Files to Modify
- /home/felix/idle-mmo-profiter/src/composables/useDataProvider.ts

## Implementation Details
1. Move the ref declarations (defaults, userOverrides) to module scope (outside the function)
2. Move the computed properties (materials, potions, resources, recipes, etc.) to module scope
3. Keep the update/clear/utility functions inside or outside -- they just operate on the module-scoped refs
4. The useDataProvider() function becomes a simple getter that returns the already-created state
5. This ensures App.vue and MarketTable.vue share the exact same reactive references

## Pattern
```typescript
// Module-scoped state (created once)
const defaults = ref(defaultData as DefaultData)
const userOverrides = ref<UserOverrides>(getUserOverrides())

// Module-scoped computed
const materials = computed(() => applyOverrides(...))
// ... etc

export function useDataProvider() {
  // Returns the same refs every time
  return { materials, potions, resources, recipes, ... }
}
```

## Verification
- All existing functionality must continue to work identically
- Calling useDataProvider() from two different components must return the same reactive objects
- Editing a value via updateMaterialPrice() must be visible in both components reactively

## Acceptance Criteria

useDataProvider is singleton; existing tests pass; calling from multiple components shares state


## Notes

**2026-02-25T22:21:34Z**

Converted useDataProvider to singleton pattern.

Changes:
- Created createDataProvider() function that contains all the logic
- Added singleton instance variable that caches the result
- useDataProvider() now returns the cached instance on every call
- All components calling useDataProvider() now share the same reactive state

Verified: Build passes successfully.
