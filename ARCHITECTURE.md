# IdleMMO Profit Calculator - Architecture

## Data Flow: Market Tab as Single Source of Truth

### Overview
The Market tab is the **single source of truth** for all item prices across the application. When users edit prices in the Market tab, those changes immediately propagate to all other tabs (Dungeons, Potions, Resources).

### Price Storage Hierarchy

The application uses a three-tier data storage system managed by `useDataProvider.ts`:

1. **User Overrides (localStorage)** - Highest priority
   - Stored in: `localStorage` under key `idlemmo-user-overrides`
   - Contains: User-edited prices for materials, potions, resources, and recipes
   - Format: `{ materials: {id: {price}}, potions: {id: {price}}, resources: {id: {marketPrice}}, recipes: {id: {price}} }`

2. **API Cache** - Medium priority (future feature)
   - Not yet implemented
   - Will contain: Real-time market data from IdleMMO API

3. **Default Data** - Lowest priority
   - Stored in: `src/data/defaults.json`
   - Contains: Baseline prices and game data
   - Used when no overrides exist

### Data Provider Architecture

#### Core Data Arrays (Single Source of Truth)
```typescript
// src/composables/useDataProvider.ts

materials: Material[] {
  id: string
  name: string
  price: number  // ← Market price (editable in Market tab)
}

potions: Potion[] {
  id: string
  name: string
  price: number  // ← Market price (editable in Market tab)
}

resources: Resource[] {
  id: string
  name: string
  marketPrice: number  // ← Market price (editable in Market tab)
  vendorValue: number  // ← Vendor price (read-only)
}

recipes: Recipe[] {
  id: string
  name: string
  price: number  // ← Market price (editable in Market tab)
  chance: number
  value?: number
}
```

#### Price Synchronization Flow

```
Market Tab Edit
      ↓
updateMaterialPrice(id, newPrice)
      ↓
userOverrides.materials[id] = { price: newPrice }
      ↓
Save to localStorage
      ↓
materials computed → applies override
      ↓
materialPriceMap computed → updates lookup map
      ↓
potionCrafts computed → updates material unitCost
      ↓
Potions Tab → recalculates profit
```

### Computed Price Synchronization

The data provider ensures that activity-specific data (potionCrafts, resourceGathering) always uses the latest prices from the canonical sources:

#### Potion Crafts Synchronization
```typescript
// Line 164-181 in useDataProvider.ts
const potionCrafts = computed(() => {
  return defaults.value.potionCrafts.map((craft) => {
    // Sync material prices from materials array
    const updatedMaterials = craft.materials.map((mat) => ({
      ...mat,
      unitCost: materialPriceMap.value.get(mat.name) ?? mat.unitCost,
    }))

    // Sync potion price from potions array
    const updatedPrice = potionPriceMap.value.get(craft.name) ?? craft.currentPrice

    return {
      ...craft,
      materials: updatedMaterials,
      currentPrice: updatedPrice,
    }
  })
})
```

#### Resource Gathering Synchronization
```typescript
// Line 188-198 in useDataProvider.ts
const resourceGathering = computed(() => {
  return defaults.value.resourceGathering.map((gather) => {
    // Sync market price from resources array
    const updatedPrice = resourcePriceMap.value.get(gather.name) ?? gather.marketPrice

    return {
      ...gather,
      marketPrice: updatedPrice,
    }
  })
})
```

### Calculator Data Flow

Each calculator receives synchronized data from the data provider:

#### Dungeon Calculator
```typescript
// App.vue line 88-92
const dungeonProfits = computed(() => {
  return calculateDungeonProfits(
    dataProvider.dungeons.value,
    dataProvider.recipes.value,  // ← Uses synced recipe prices
    magicFind.value
  )
})

// dungeonCalculator.ts line 65
expectedValue = recipe.price * recipe.chance * (1 + totalMF / 100)
// Uses recipe.price from the recipes array (Market tab source of truth)
```

#### Potion Calculator
```typescript
// App.vue line 96-100
const potionProfits = computed(() => {
  return calculatePotionProfits(
    dataProvider.potionCrafts.value,  // ← Uses synced material prices & potion prices
    marketTaxRate.value
  )
})

// potionCalculator.ts line 58-59
totalMaterialCost = mat.quantity * mat.unitCost
// Uses mat.unitCost synced from materials array (Market tab source of truth)

// potionCalculator.ts line 72
sellAfterTax = potion.currentPrice * (1 - taxRate)
// Uses currentPrice synced from potions array (Market tab source of truth)
```

#### Resource Calculator
```typescript
// App.vue line 104-108
const resourceProfits = computed(() => {
  return calculateResourceProfits(
    dataProvider.resourceGathering.value,  // ← Uses synced resource prices
    marketTaxRate.value
  )
})

// resourceCalculator.ts line 43
marketAfterTax = resource.marketPrice * (1 - taxRate)
// Uses marketPrice synced from resources array (Market tab source of truth)
```

### Reactivity Chain

All data is reactive through Vue's computed properties:

```
User edits price in Market tab
      ↓
updateXxxPrice() → userOverrides ref updates
      ↓
materials/potions/resources computed → recalculates
      ↓
materialPriceMap/potionPriceMap/resourcePriceMap computed → recalculates
      ↓
potionCrafts/resourceGathering computed → recalculates with new prices
      ↓
dungeonProfits/potionProfits/resourceProfits computed → recalculates
      ↓
UI re-renders automatically across ALL tabs
```

No manual refresh needed. All changes propagate instantly.

### Key Files

- **src/composables/useDataProvider.ts** - Singleton data provider, manages price synchronization
- **src/components/MarketTable.vue** - UI for editing prices (writes to data provider)
- **src/calculators/dungeonCalculator.ts** - Reads recipe prices from data provider
- **src/calculators/potionCalculator.ts** - Reads material and potion prices from data provider
- **src/calculators/resourceCalculator.ts** - Reads resource prices from data provider
- **src/App.vue** - Wires calculators to reactive data provider

### Verification

To verify the Market tab is the single source of truth:

1. Edit a material price in Market tab
2. Go to Potions tab → See material cost updated
3. Edit a potion price in Market tab
4. Go to Potions tab → See current price updated
5. Edit a resource price in Market tab
6. Go to Resources tab → See market price updated
7. Edit a recipe price in Market tab
8. Go to Dungeons tab → See expected value updated

See `src/tests/market-price-sync.test.md` for detailed test scenarios.

### Common Misconceptions

#### "Prices are duplicated in defaults.json"
✅ TRUE but by design. The defaults.json contains baseline values in multiple places:
- `materials[].price` - canonical material prices
- `potionCrafts[].materials[].unitCost` - duplicates material prices (for defaults only)
- `potionCrafts[].currentPrice` - duplicates potion prices (for defaults only)

However, at runtime, the data provider synchronizes all duplicate values from the canonical sources using computed properties.

#### "Calculators read embedded prices"
❌ FALSE. Calculators receive data through the data provider's computed properties, which have already been synchronized from the canonical price sources. The embedded prices in defaults.json are never used directly by calculators—they're always overridden by the computed properties.

#### "Need to manually refresh for price changes"
❌ FALSE. All data is reactive. Price changes propagate instantly through the computed property chain.

### Future Enhancements

- API integration: Fetch real-time market prices from IdleMMO API
- Price history tracking: Store historical price data for charts
- Bulk import: Allow users to import price data from CSV/Excel
- Price alerts: Notify users when market prices change significantly
