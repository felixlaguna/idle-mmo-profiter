# Architecture: Before and After Fix

## BEFORE (BROKEN) - Multiple Ref Instances

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    App.vue                          │  │
│  │                                                     │  │
│  │  const { getFilteredAndRerankedActivities }        │  │
│  │       = useActivityFilters()  ────────┐            │  │
│  │                                       │            │  │
│  │  const bestAction = computed(() => {  │            │  │
│  │    const filtered =                   │            │  │
│  │      getFilteredAndRerankedActivities │            │  │
│  │    return getBestAction(filtered)     │            │  │
│  │  })                                   │            │  │
│  └───────────────────────────────────────┼────────────┘  │
│                                          │                │
│         ┌────────────────────────────────┘                │
│         │ Creates NEW refs                                │
│         ▼                                                 │
│  ┌─────────────────────────────┐                         │
│  │  useActivityFilters()       │                         │
│  │  function scope             │                         │
│  │  ┌───────────────────────┐  │                         │
│  │  │ filters = ref(...)    │◄─┼─────────┐               │
│  │  │   dungeons: true      │  │         │ Reads from    │
│  │  │   potions: true       │  │         │ localStorage  │
│  │  │   resources: true     │  │         │               │
│  │  └───────────────────────┘  │         │               │
│  │         REF A                │         │               │
│  └─────────────────────────────┘         │               │
│                                           │               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           ProfitRankingTable.vue                    │ │
│  │                                                     │ │
│  │  const { filterDungeons, ... }                     │ │
│  │       = useActivityFilters()  ───────┐             │ │
│  │                                      │             │ │
│  │  <button @click="filterDungeons      │             │ │
│  │    = !filterDungeons">               │             │ │
│  └──────────────────────────────────────┼─────────────┘ │
│                                         │                │
│         ┌───────────────────────────────┘                │
│         │ Creates NEW refs AGAIN                         │
│         ▼                                                │
│  ┌─────────────────────────────┐                        │
│  │  useActivityFilters()       │                        │
│  │  function scope             │                        │
│  │  ┌───────────────────────┐  │                        │
│  │  │ filters = ref(...)    │◄─┼─────────┐              │
│  │  │   dungeons: true      │  │         │ Reads from   │
│  │  │   potions: true       │  │         │ localStorage │
│  │  │   resources: true     │  │         │              │
│  │  └───────────────────────┘  │         │              │
│  │         REF B                │         │              │
│  └─────────────────────────────┘         │              │
│                                           │              │
│                                           │              │
│                  ┌────────────────────────┴──────────┐   │
│                  │      localStorage                 │   │
│                  │  "idlemmo:active-filters"         │   │
│                  │  { dungeons: true, ... }          │   │
│                  └───────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘

❌ PROBLEM:
- REF A and REF B are SEPARATE objects
- User toggles filter → REF B changes
- localStorage updates
- But Vue doesn't know REF A and REF B are related
- REF A never re-evaluates → App.vue bestAction STUCK
```

## AFTER (FIXED) - Singleton Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  useActivityFilters.ts  (MODULE LEVEL)              │   │
│  │                                                     │   │
│  │  // Created ONCE when module loads                 │   │
│  │  const filters = useStorage<ActivityFilters>(...)  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         SINGLETON REF                         │  │   │
│  │  │  filters = {                                  │  │   │
│  │  │    value: {                                   │  │   │
│  │  │      dungeons: true,                          │  │   │
│  │  │      potions: true,                           │  │   │
│  │  │      resources: true                          │  │   │
│  │  │    }                                          │  │   │
│  │  │  }                                            │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                    ▲                                │   │
│  │                    │                                │   │
│  │  export function useActivityFilters() {            │   │
│  │    // Returns functions that READ from filters     │   │
│  │    return {                                        │   │
│  │      getFilteredActivities,                        │   │
│  │      getFilteredAndRerankedActivities              │   │
│  │    }                                               │   │
│  │  }                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                       │           │
│         │ Returns functions                     │           │
│         │ that access                           │           │
│         │ SINGLETON REF                         │           │
│         ▼                                       ▼           │
│  ┌─────────────────────┐         ┌────────────────────────┐│
│  │    App.vue          │         │  ProfitRankingTable    ││
│  │                     │         │        .vue            ││
│  │  const { get...  } │         │  const { filter... }   ││
│  │    = useActivity   │         │    = useActivity       ││
│  │      Filters()     │         │      Filters()         ││
│  │                     │         │                        ││
│  │  const bestAction  │         │  <button @click=       ││
│  │    = computed(() => │         │    "filterDungeons     ││
│  │      const filtered│         │      = !filter...">    ││
│  │        = get...(...)│         │                        ││
│  │    )                │         │  User clicks ──────────┼┤
│  │                     │         │  filterDungeons        ││
│  │  ▲                  │         │  = false               ││
│  │  │                  │         │       │                ││
│  │  │ Re-evaluates!    │         │       │                ││
│  │  │ (reactivity)     │         │       └────────────────┼┤
│  │  │                  │         │          Sets value    ││
│  │  │                  │         │          in SINGLETON  ││
│  │  │                  │         │                        ││
│  └──┼──────────────────┘         └────────────────────────┘│
│     │                                     │                 │
│     │                                     │                 │
│     └──────────── Vue Reactivity ────────┘                 │
│         Detects SINGLETON REF changed                      │
│         Notifies ALL computed properties                   │
│         that depend on it                                  │
│                                                             │
│                  ┌────────────────────────────────┐         │
│                  │      localStorage              │         │
│                  │  "idlemmo:active-filters"      │         │
│                  │  { dungeons: false, ... }      │         │
│                  └────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

✅ SOLUTION:
- ONE SINGLETON REF shared by all
- User toggles filter → SINGLETON REF changes
- Vue reactivity detects change
- ALL computed properties that read from SINGLETON REF re-evaluate
- App.vue bestAction updates IMMEDIATELY
- ProfitRankingTable filteredActivities updates IMMEDIATELY
- Perfect sync achieved
```

## Key Differences

### BEFORE
```typescript
export function useActivityFilters() {
  const filters = useStorage(...) // NEW ref every call
  return { ... }
}
```

**Result:** Each component gets its own ref → no reactivity between them

### AFTER
```typescript
const filters = useStorage(...) // ONE ref at module level

export function useActivityFilters() {
  return { ... } // Returns functions that access THE SAME ref
}
```

**Result:** All components share one ref → Vue reactivity works across components

## Why This Pattern Works

1. **Module Execution:** JavaScript modules execute once when first imported
2. **Singleton Creation:** `const filters = ...` runs once → creates one ref
3. **Shared Reference:** All components import the same module → access same ref
4. **Vue Reactivity:** Vue tracks that ref across all usages
5. **Automatic Updates:** Change in one place → reactivity propagates everywhere

## The Fix in One Line

**Moved `const filters = ...` from INSIDE the function to OUTSIDE (module level)**

That's it. One line moved = bug fixed.
