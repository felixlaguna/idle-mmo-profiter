---
id: imp-wk4d
status: closed
deps: [imp-q6nm]
links: []
created: 2026-02-25T18:31:56Z
type: task
priority: 2
assignee: Félix Laguna Teno
parent: imp-dv3t
---
# Define TypeScript data model interfaces

Create src/types.ts with all interfaces:

- Material: { id: string, name: string, price: number }
- Potion: { id: string, name: string, price: number }
- Resource: { id: string, name: string, marketPrice: number }
- Recipe: { id: string, name: string, price: number, chance: number, value?: number }
- Dungeon: { name: string, runCost: number, timeSeconds: number, numDrops: number, drops: DungeonDrop[] }
- DungeonDrop: { recipeName: string, expectedValue: number }
- PotionCraft: { name: string, timeSeconds: number, materials: PotionMaterial[], vialCost: number, currentPrice: number }
- PotionMaterial: { name: string, quantity: number, unitCost: number }
- ResourceGather: { name: string, timeSeconds: number, cost: number, vendorValue: number, marketPrice: number }
- MagicFindSettings: { streak: number, dungeon: number, item: number, bonus: number }
- AppSettings: { apiKey: string | null, marketTaxRate: number, magicFind: MagicFindSettings }
- ProfitResult: { activityName: string, type: 'dungeon' | 'potion' | 'resource', profitPerHour: number, profitPerAction: number, timePerAction: number, cost: number }

## Acceptance Criteria

All types compile, exported from types.ts


## Notes

**2026-02-25T18:46:16Z**

TypeScript interfaces complete. Created src/types/index.ts with:
- Material, Potion, Resource, Recipe interfaces
- Dungeon, DungeonDrop interfaces
- PotionCraft, PotionMaterial interfaces
- ResourceGather interface
- MagicFindSettings, AppSettings interfaces
- ProfitResult interface with ActivityType union type
- DefaultData interface (structure for defaults.json)
All types verified with vue-tsc --noEmit (no errors)
