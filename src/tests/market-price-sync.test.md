# Market Price Synchronization Test

## Purpose

Verify that the Market tab is the single source of truth for all item prices across the app.

## Test Scenario 1: Material Price Update

**Steps:**

1. Open the app
2. Go to Market tab
3. Find "Moose antler" (default price: 125 gold)
4. Edit the price to 200 gold
5. Go to Potions tab
6. Find "Wraithbane" potion (uses 15x Moose antler)
7. Verify that material cost shows 15 × 200 = 3000 gold (not 15 × 125 = 1875)

**Expected Result:** Material cost updates immediately to reflect the new price.

## Test Scenario 2: Potion Price Update

**Steps:**

1. Open the app
2. Go to Market tab
3. Find "Wraithbane" potion (default price: 11600 gold)
4. Edit the price to 15000 gold
5. Go to Potions tab
6. Find "Wraithbane" in the table
7. Verify that Current Price shows 15000 gold
8. Verify that Profit calculation uses the new price

**Expected Result:** Potion profit updates to use the new market price.

## Test Scenario 3: Resource Price Update

**Steps:**

1. Open the app
2. Go to Market tab
3. Find "Coal" (default market price: 6 gold, vendor value: 1 gold)
4. Edit the market price to 10 gold
5. Go to Resources tab
6. Find "Coal" in the table
7. Verify that Market Price shows 10 gold
8. Verify that profit calculation uses the new price

**Expected Result:** Resource profit updates to use the new market price.

## Test Scenario 4: Recipe Price Update

**Steps:**

1. Open the app
2. Go to Market tab
3. Find a recipe (e.g., "Improved Fishing Rod Recipe", default price: 300 gold)
4. Edit the price to 500 gold
5. Go to Dungeons tab
6. Find a dungeon that drops this recipe
7. Verify that the expected value calculation uses the new price

**Expected Result:** Dungeon drop value updates to use the new recipe price.

## Bug Validation Tests

### Bug 1: Resource vendorValue Missing

**Current Behavior:**

- Resource interface is missing vendorValue field
- MarketTable shows "N/A" for resource vendor values
- Resources in defaults.json have vendorValue but TypeScript doesn't recognize it

**Test:**

1. Check src/types/index.ts - Resource interface should have vendorValue: number
2. Check MarketTable.vue - Resources section should display resource.vendorValue
3. Open app and check Market tab - Resources should show vendor value

### Bug 2: Material Vendor/Market Confusion

**Current Behavior:**

- Materials only have one 'price' field
- MarketTable shows this as both Vendor Value AND Market Value
- This is confusing - implies materials have two different prices

**Test:**

1. Check defaults.json - materials only have 'price' field (correct)
2. Check MarketTable.vue - should clarify that materials have a single price
3. Consider updating UI to show "Price" instead of "Vendor Value" and "Market Value"

## Architecture Validation

### Data Flow Check

**Verify the following chain works:**

1. Market tab edit → updateMaterialPrice() → userOverrides.materials
2. userOverrides → materials computed → materialPriceMap computed
3. materialPriceMap → potionCrafts computed → updates unitCost
4. potionCrafts → potionProfits computed → recalculates
5. potionProfits → displayed in Potions tab

### Reactivity Check

**Verify that changes are reactive:**

- No manual refresh needed
- All tabs update automatically
- LocalStorage persistence works
- Override badge updates in Market tab

## Manual Testing Checklist

- [ ] Build completes without errors
- [ ] Material price changes affect potion calculations
- [ ] Potion price changes affect potion profit display
- [ ] Resource price changes affect resource profit display
- [ ] Recipe price changes affect dungeon expected values
- [ ] Vendor values display correctly for resources
- [ ] Override count badge shows correct number
- [ ] Reset buttons work correctly
- [ ] LocalStorage persists across page reloads
