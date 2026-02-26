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

### Market Value Refresh System

The application includes a comprehensive market value refresh system that allows users to automatically update item prices from the IdleMMO API. This feature respects rate limits, provides progress tracking, and supports selective refresh.

#### Architecture Overview

The refresh system is built on three main components:

1. **useMarketRefresh Composable** - Core business logic for price refresh
2. **useDataProvider Exclusion Methods** - Manages which items to refresh
3. **MarketTable UI** - User interface with refresh controls

#### useMarketRefresh Composable

Located in `src/composables/useMarketRefresh.ts`, this singleton composable handles all refresh operations:

```typescript
// Core Methods
refreshItemPrice(category, itemId)  // Refresh a single item
refreshAllItems(options?)           // Bulk refresh with progress tracking
getRefreshEstimate()                // Calculate refresh statistics
cancelRefresh()                     // Abort ongoing refresh

// Reactive State
isRefreshing                        // Boolean indicating refresh in progress
refreshProgress                     // Object with current/total/skipped/currentItem
lastRefreshTime                     // Timestamp of last successful refresh
refreshErrors                       // Array of errors encountered during refresh
```

**Refresh Flow:**
1. Check if item has `hashedId` in defaults (populated by scripts/populate-hashed-ids.ts)
2. If no `hashedId`, call search API to find it
3. Call market-history API with the `hashedId`
4. Calculate average price from latest N sold items (default: 10)
5. Update price via `dataProvider.updateXxxPrice()`
6. Invalidate cache to ensure fresh data

**Rate Limiting:**
- The API client enforces 20 requests/minute
- Bulk refresh respects this limit automatically
- Progress bar shows real-time progress with current item name

**Error Handling:**
- Individual item failures don't stop bulk refresh
- Errors are collected in `refreshErrors` array
- Toast notifications inform users of results

#### Refresh Exclusion System

The data provider includes methods to selectively exclude items from refresh:

```typescript
// Per-Item Exclusion
setRefreshExcluded(category, itemId, excluded: boolean)
isRefreshExcluded(category, itemId): boolean

// Bulk Exclusion
setAllRefreshExcluded(category, excluded: boolean)

// Statistics
getExclusionStats(category?): {
  total: number
  excluded: number
  included: number
  // When no category specified, also includes per-category breakdown
}
```

**Storage:**
- Exclusion state stored in `userOverrides` (localStorage)
- Persists across sessions
- Format: `{ materials: { 'mat-1': { refreshExcluded: true } } }`

**Benefits:**
- Reduces refresh time by skipping unwanted items
- Users can exclude items with stable prices (e.g., vendor-only items)
- Three-state checkboxes show mixed exclusion states per section

#### MarketTable UI Integration

The Market tab provides comprehensive refresh controls:

**Top-Level Controls:**
- "Refresh All Prices" button with pre-refresh estimate modal
- Shows total items, excluded items, and estimated time
- Real-time progress bar during refresh
- Cancel button to abort mid-refresh

**Per-Item Controls:**
- Individual refresh button with loading spinner
- Exclusion checkbox to include/exclude from bulk refresh
- Visual feedback (reduced opacity) for excluded items

**Section-Level Controls:**
- Three-state checkboxes in section headers
- Quick exclude/include all items in a category
- Exclusion count badges (e.g., "5 excluded")

**API Key Guard:**
- All refresh buttons disabled when no API key configured
- Helpful tooltips guide users to settings
- Validation ensures key has correct scopes

#### Data Model Enhancements

All item types now include refresh-related fields:

```typescript
interface Material {
  id: string
  name: string
  price: number
  hashedId?: string      // IdleMMO API hashed_item_id
  vendorValue?: number   // NPC sell price
}

interface Potion {
  id: string
  name: string
  price: number
  hashedId?: string      // IdleMMO API hashed_item_id
  vendorValue?: number   // NPC sell price
}

interface Recipe {
  id: string
  name: string
  price: number
  chance: number
  value?: number
  hashedId?: string      // IdleMMO API hashed_item_id
  vendorValue?: number   // NPC sell price
}

interface Resource {
  id: string
  name: string
  marketPrice: number
  vendorValue: number    // Already existed
  hashedId?: string      // IdleMMO API hashed_item_id
}
```

**Field Purposes:**
- `hashedId`: Required for API calls, populated via scripts/populate-hashed-ids.ts
- `vendorValue`: Displayed in Market tab for comparison, helps users decide when to vendor vs. market

#### Price Calculation

The refresh system calculates market price as the average of the latest N sold items (default: 10):

```typescript
// From src/api/services.ts
export async function getAverageMarketPrice(
  hashedId: string,
  sampleSize: number = 10
): Promise<number | null> {
  const history = await getMarketHistory(hashedId)

  // Filter to sold items, sort by recent, take N samples
  const recentSold = history.history
    .filter(item => item.type === 'sold')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, sampleSize)

  // Calculate average
  return recentSold.length > 0
    ? Math.round(recentSold.reduce((sum, item) => sum + item.price, 0) / recentSold.length)
    : null
}
```

**Why average instead of latest?**
- Reduces impact of outliers and market manipulation
- Provides more stable pricing
- Sample size of 10 balances accuracy and recency

#### Scripts and Utilities

**scripts/populate-hashed-ids.ts:**
- One-time script to populate `hashedId` for all 369 items
- Searches each item by name via API
- Requires valid API key
- Updates defaults.json with results
- Run via: `npm run populate-hashed-ids`

**scripts/add-market-fields.js:**
- One-time script to add `hashedId` and `vendorValue` fields to defaults.json
- Already run during Phase 1 implementation
- Can be re-run safely (won't overwrite existing values)

#### Performance Considerations

**Total Items:** ~369 (11 materials + 6 potions + 7 resources + 345 recipes)

**Refresh Time Estimates:**
- At 20 requests/minute: ~18-19 minutes for full refresh
- Each item requires 1-2 API calls (search if no hashedId + market-history)
- Exclusions significantly reduce time (e.g., excluding 200 recipes = ~10 minutes saved)

**Recommendations:**
- Use exclusions to skip vendor-only or stable-price items
- Run full refresh during off-hours or breaks
- Consider section-level refresh for faster updates
- The UI shows estimated time before starting

#### Testing

Comprehensive test coverage ensures reliability:

**useMarketRefresh Tests (17 tests):**
- Single item refresh success/failure cases
- Bulk refresh with progress tracking
- Exclusion system integration
- Cancellation support
- Error collection and handling
- API search fallback when no hashedId
- State management and reactivity

**useDataProvider Tests (29 tests):**
- `setRefreshExcluded` for all categories
- `isRefreshExcluded` validation
- `setAllRefreshExcluded` bulk operations
- `getExclusionStats` calculation accuracy
- Persistence across sessions
- Integration with clearAllOverrides
- Complex exclusion patterns

All tests located in `src/tests/composables/`.

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

- **src/composables/useDataProvider.ts** - Singleton data provider, manages price synchronization and refresh exclusions
- **src/composables/useMarketRefresh.ts** - Market value refresh logic, API integration, progress tracking
- **src/components/MarketTable.vue** - UI for editing prices and refresh controls
- **src/calculators/dungeonCalculator.ts** - Reads recipe prices from data provider
- **src/calculators/potionCalculator.ts** - Reads material and potion prices from data provider
- **src/calculators/resourceCalculator.ts** - Reads resource prices from data provider
- **src/api/services.ts** - API service layer, includes market price fetching
- **src/App.vue** - Wires calculators to reactive data provider
- **scripts/populate-hashed-ids.ts** - One-time script to populate API hashed IDs
- **scripts/add-market-fields.js** - One-time script to add market-related fields

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

- ✅ API integration: Fetch real-time market prices from IdleMMO API (IMPLEMENTED - see Market Value Refresh System)
- Price history tracking: Store historical price data for charts
- Bulk import: Allow users to import price data from CSV/Excel
- Price alerts: Notify users when market prices change significantly
- Scheduled auto-refresh: Automatically refresh prices on a schedule
- Per-item refresh history: Track when each item was last refreshed
