---
id: imp-j645
status: closed
deps: []
links: []
created: 2026-03-04T19:32:56Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-xdt8
---
# Phase 1: TypeScript types and data model

Define all TypeScript interfaces for the Character Value Tracker feature.

## Types to create (in src/types/index.ts)

### CharacterInventoryItem
- hashId: string (references item hash_id from market data)
- quantity: number

### CharacterSnapshot
- timestamp: string (ISO date)
- gold: number
- inventory: CharacterInventoryItem[]

### Character
- id: string (generated UUID)
- name: string
- gold: number
- inventory: CharacterInventoryItem[] (current working state, not yet saved)
- history: CharacterSnapshot[]

### CharacterStore (top-level localStorage shape)
- characters: Character[]
- activeCharacterId: string | null

## Notes
- hashId is sufficient to look up current market price from useDataProvider's materials/craftables/resources/recipes
- Gold is stored both in the current Character state AND in each snapshot
- Inventory items do NOT store price; price is resolved at render time from live market data
- History entries are append-only (save creates a new snapshot)

## Acceptance Criteria

All TypeScript interfaces added to src/types/index.ts. Types compile without errors.


**2026-03-04T19:37:13Z**

Types added to src/types/index.ts:
- CharacterInventoryItem: hashId, quantity, priceAtTime
- CharacterSnapshot: timestamp, gold, inventory
- Character: id, name, gold, inventory, history
- CharacterStore: characters[], activeCharacterId

priceAtTime field added per HISTORICAL PRICES requirement to store market prices at snapshot time.
