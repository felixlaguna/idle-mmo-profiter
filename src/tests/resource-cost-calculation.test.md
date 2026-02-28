# Resource Cost Calculation Test

## Purpose

Verify that resource gathering costs are calculated dynamically from input material market prices, not hardcoded values.

## Fix Description

Resource gathering activities that require input materials (Coal for cooking/smelting) now compute costs dynamically from market prices.

### Implementation

- Added `ResourceInput` type with `resourceName`, `quantity`, and `useMarketPrice` fields
- Changed `cost` field to `baseCost` (base gathering cost like rod/pickaxe wear)
- Added optional `inputs` array to specify required materials
- Data provider computes `cost = baseCost + sum(input.quantity * inputPrice)`
- Input prices use current market prices from resourcePriceMap (respects user overrides)

### Example: Cooked Stingray

- **Base Cost:** 0 (no tool wear for cooking)
- **Inputs:** 1x Stingray (market: 38 gold) + 1x Coal (market: 6 gold)
- **Computed Cost:** 0 + 38 + 6 = 44 gold
- **Dynamic:** If user changes Coal market price to 10, cost becomes 0 + 38 + 10 = 48 gold

### Example: Mystic Bar

- **Base Cost:** 0 (no tool wear for smelting)
- **Inputs:** 1x Mystic Ore (market: 24 gold) + 1x Coal (market: 6 gold)
- **Computed Cost:** 0 + 24 + 6 = 30 gold
- **Dynamic:** If user changes Coal market price to 10, cost becomes 0 + 24 + 10 = 34 gold

## Test Scenario 1: Cooked Stingray Cost Updates

**Steps:**

1. Open the app
2. Go to Market tab
3. Note Coal market price (default: 6 gold)
4. Note Stingray market price (default: 38 gold)
5. Go to Resources tab
6. Find "Cooked Stingray"
7. Verify Cost = 44 gold (38 + 6)
8. Go back to Market tab
9. Change Coal market price to 10 gold
10. Go to Resources tab
11. Find "Cooked Stingray"
12. Verify Cost = 48 gold (38 + 10)

**Expected Result:**
Cost updates dynamically to 48 gold when Coal price changes to 10 (test PASSES)

## Test Scenario 2: Mystic Bar Cost Updates

**Steps:**

1. Open the app
2. Go to Market tab
3. Note Coal market price (default: 6 gold)
4. Note Mystic Ore market price (default: 24 gold)
5. Go to Resources tab
6. Find "Mystic Bar"
7. Verify Cost = 30 gold (24 + 6)
8. Go back to Market tab
9. Change Coal market price to 15 gold
10. Go to Resources tab
11. Find "Mystic Bar"
12. Verify Cost = 39 gold (24 + 15)

**Expected Result:**
Cost updates dynamically to 39 gold when Coal price changes to 15 (test PASSES)

## Test Scenario 3: Cooked Great White Shark Cost Updates

**Steps:**

1. Open the app
2. Go to Market tab
3. Note Coal market price (default: 6 gold)
4. Note Great White Shark market price (default: 56 gold)
5. Go to Resources tab
6. Find "Cooked Great White Shark"
7. Verify Cost = 62 gold (56 + 6)
8. Go back to Market tab
9. Change Great White Shark market price to 70 gold
10. Go to Resources tab
11. Find "Cooked Great White Shark"
12. Verify Cost = 76 gold (70 + 6)

**Expected Result:**
Cost updates dynamically to 76 gold when Great White Shark price changes to 70 (test PASSES)

## Complete Resource Gathering Input Requirements

From Excel analysis (Profit sheet formulas):

1. **Coal** - No inputs, cost = 0
2. **Stingray** - No inputs (fishing rod cost?), cost = 16
3. **Cooked Stingray** - Inputs: 1x Stingray + 1x Coal, cost = Stingray market + Coal market
4. **Cooked Stingray full** - Inputs: 1x Coal (fishing included), cost = Stingray cost + Coal market
5. **Great White Shark** - No inputs (fishing rod cost?), cost = 25
6. **Cooked Great White Shark** - Inputs: 1x Great White Shark + 1x Coal, cost = Great White Shark market + Coal market
7. **Cooked Great White Shark full** - Inputs: 1x Coal (fishing included), cost = Great White Shark cost + Coal market
8. **Cooked Great White Shark full + coal** - Inputs: None (coal mining included), cost = Great White Shark cost
9. **Mystic Ore** - No inputs, cost = 0
10. **Mystic Bar** - Inputs: 1x Mystic Ore + 1x Coal, cost = Mystic Ore market + Coal market
11. **Mystic Bar full** - Inputs: 1x Coal (mining included), cost = Mystic Ore cost + Coal market
12. **Mystic Bar full + coal** - Inputs: None (coal mining included), cost = Mystic Ore cost

## Automated Test

Run the automated test script to verify cost calculations:

```bash
npx tsx scripts/test-resource-costs.ts
```

**Expected Output:**

- Test 1 (Default prices): All 12 resources show ✓, test PASSED
- Test 2 (Coal price changed to 10): All costs update correctly, test PASSED
- Test 3 (Stingray price changed to 50): Cooked Stingray cost updates, test PASSED

**Test Results (2025-02-25):**
All automated tests PASSED ✓

## Manual Testing Checklist

- [x] Build completes without errors
- [ ] Changing Coal price updates all cooked/smelted resource costs
- [ ] Changing Stingray price updates "Cooked Stingray" cost
- [ ] Changing Great White Shark price updates "Cooked Great White Shark" cost
- [ ] Changing Mystic Ore price updates "Mystic Bar" cost
- [ ] Resource profit calculations use the updated costs
- [ ] All tests in market-price-sync.test.md still pass
