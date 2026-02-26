/**
 * Test script to verify resource cost calculations
 * Run with: npx tsx scripts/test-resource-costs.ts
 */

import defaultData from '../src/data/defaults.json'
import type { ResourceGather, ResourceInput } from '../src/types'

// Simulate the data provider's cost calculation logic
function calculateCost(
  resource: ResourceGather & { baseCost: number; inputs?: ResourceInput[] },
  resourcePriceMap: Map<string, number>,
  resourceBaseCostMap: Map<string, number>
): number {
  let cost = resource.baseCost

  if (resource.inputs && resource.inputs.length > 0) {
    for (const input of resource.inputs) {
      const inputPrice = input.useMarketPrice
        ? resourcePriceMap.get(input.resourceName) ?? 0
        : resourceBaseCostMap.get(input.resourceName) ?? 0

      cost += input.quantity * inputPrice
    }
  }

  return cost
}

// Test with default prices
console.log('=== TEST 1: Default Market Prices ===\n')

const defaultPriceMap = new Map<string, number>()
const defaultBaseCostMap = new Map<string, number>()

defaultData.resourceGathering.forEach((r: any) => {
  defaultPriceMap.set(r.name, r.marketPrice)
  defaultBaseCostMap.set(r.name, r.baseCost)
})

const expectedDefaults = {
  Coal: 0,
  Stingray: 16,
  'Cooked Stingray': 44,
  'Cooked Stingray full': 22,
  'Great White Shark': 25,
  'Cooked Great White Shark': 62,
  'Cooked Great White Shark full': 31,
  'Cooked Great White Shark full + coal': 25,
  'Mystic Ore': 0,
  'Mystic Bar': 30,
  'Mystic Bar full': 6,
  'Mystic Bar full + coal': 0,
}

let allMatch = true
defaultData.resourceGathering.forEach((r: any) => {
  const cost = calculateCost(r, defaultPriceMap, defaultBaseCostMap)
  const expected = expectedDefaults[r.name as keyof typeof expectedDefaults]
  const match = cost === expected
  if (!match) allMatch = false

  console.log(`${r.name}: ${cost} (expected: ${expected}) ${match ? '✓' : '✗ FAIL'}`)
})

console.log(`\nTest 1: ${allMatch ? 'PASSED' : 'FAILED'}\n`)

// Test with changed Coal price
console.log('=== TEST 2: Coal Price Changed to 10 ===\n')

const modifiedPriceMap = new Map(defaultPriceMap)
modifiedPriceMap.set('Coal', 10)

const expectedWithCoal10 = {
  Coal: 0,
  Stingray: 16,
  'Cooked Stingray': 48, // Stingray (38) + Coal (10) = 48
  'Cooked Stingray full': 26, // Base (16) + Coal (10) = 26
  'Great White Shark': 25,
  'Cooked Great White Shark': 66, // Great White Shark (56) + Coal (10) = 66
  'Cooked Great White Shark full': 35, // Base (25) + Coal (10) = 35
  'Cooked Great White Shark full + coal': 25,
  'Mystic Ore': 0,
  'Mystic Bar': 34, // Mystic Ore (24) + Coal (10) = 34
  'Mystic Bar full': 10, // Base (0) + Coal (10) = 10
  'Mystic Bar full + coal': 0,
}

allMatch = true
defaultData.resourceGathering.forEach((r: any) => {
  const cost = calculateCost(r, modifiedPriceMap, defaultBaseCostMap)
  const expected = expectedWithCoal10[r.name as keyof typeof expectedWithCoal10]
  const match = cost === expected
  if (!match) allMatch = false

  console.log(`${r.name}: ${cost} (expected: ${expected}) ${match ? '✓' : '✗ FAIL'}`)
})

console.log(`\nTest 2: ${allMatch ? 'PASSED' : 'FAILED'}\n`)

// Test with changed Stingray price
console.log('=== TEST 3: Stingray Price Changed to 50 ===\n')

const modifiedStingrayMap = new Map(defaultPriceMap)
modifiedStingrayMap.set('Stingray', 50)

const expectedWithStingray50 = {
  Coal: 0,
  Stingray: 16,
  'Cooked Stingray': 56, // Stingray (50) + Coal (6) = 56
  'Cooked Stingray full': 22, // Base (16) + Coal (6) = 22 (unchanged)
  'Great White Shark': 25,
  'Cooked Great White Shark': 62,
  'Cooked Great White Shark full': 31,
  'Cooked Great White Shark full + coal': 25,
  'Mystic Ore': 0,
  'Mystic Bar': 30,
  'Mystic Bar full': 6,
  'Mystic Bar full + coal': 0,
}

allMatch = true
defaultData.resourceGathering.forEach((r: any) => {
  const cost = calculateCost(r, modifiedStingrayMap, defaultBaseCostMap)
  const expected = expectedWithStingray50[r.name as keyof typeof expectedWithStingray50]
  const match = cost === expected
  if (!match) allMatch = false

  console.log(`${r.name}: ${cost} (expected: ${expected}) ${match ? '✓' : '✗ FAIL'}`)
})

console.log(`\nTest 3: ${allMatch ? 'PASSED' : 'FAILED'}\n`)

console.log('=== ALL TESTS COMPLETE ===')
