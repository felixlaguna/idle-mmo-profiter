/**
 * Test for Stormbringer Striders forging cost calculation bug
 *
 * Bug: The forging cost should match the sum of materials at current market prices,
 * but Turtle material has a price mismatch between materials array and craftableRecipes.
 */

import { describe, it, expect } from 'vitest'
import { calculateCraftableProfits } from '../../calculators/craftableCalculator'
import type { CraftableRecipe } from '../../types'

describe('Stormbringer Striders forging cost bug', () => {
  const mockTaxRate = 0.12

  it('should calculate correct forging cost when material prices are updated', () => {
    // Stormbringer Striders with UPDATED Turtle price (37.6, not 35)
    const stormbringerRecipe: CraftableRecipe = {
      name: 'Stormbringer Striders',
      timeSeconds: 1327.4,
      materials: [
        { name: 'Moose Antler', quantity: 56 },
        { name: 'Air Elemental Essence', quantity: 10 },
        { name: 'Ruined Robes', quantity: 10 },
        { name: 'Boar Tusk', quantity: 25 },
        { name: 'Turtle', quantity: 10000 }, // Price resolved from materialPriceMap
      ],
      currentPrice: 9000000,
      skill: 'forging',
    }

    // Material price map with CORRECTED prices
    const materialPriceMap = new Map<string, number>([
      ['Moose Antler', 121.1],
      ['Air Elemental Essence', 277.9],
      ['Ruined Robes', 23],
      ['Boar Tusk', 404.9],
      ['Turtle', 37.6], // CORRECTED price
    ])

    const results = calculateCraftableProfits(
      [stormbringerRecipe],
      mockTaxRate,
      materialPriceMap,
      []
    )

    expect(results).toHaveLength(1)
    const result = results[0]

    // Calculate expected total cost with CORRECT Turtle price
    // Moose Antler: 56 × 121.1 = 6,781.6
    // Air Elemental Essence: 10 × 277.9 = 2,779
    // Ruined Robes: 10 × 23 = 230
    // Boar Tusk: 25 × 404.9 = 10,122.5
    // Turtle: 10,000 × 37.6 = 376,000
    const expectedTotalCost = 6781.6 + 2779 + 230 + 10122.5 + 376000

    expect(result.totalCost).toBeCloseTo(expectedTotalCost, 1)
    expect(result.totalCost).toBeCloseTo(395913.1, 1)
  })

  it('should fail with INCORRECT Turtle price (this demonstrates the bug)', () => {
    // Stormbringer Striders with OLD/INCORRECT Turtle price (35)
    const stormbringerRecipeWithBug: CraftableRecipe = {
      name: 'Stormbringer Striders',
      timeSeconds: 1327.4,
      materials: [
        { name: 'Moose Antler', quantity: 56 },
        { name: 'Air Elemental Essence', quantity: 10 },
        { name: 'Ruined Robes', quantity: 10 },
        { name: 'Boar Tusk', quantity: 25 },
        { name: 'Turtle', quantity: 10000 }, // Price resolved from materialPriceMap
      ],
      currentPrice: 9000000,
      skill: 'forging',
    }

    // Material price map with INCORRECT Turtle price
    const materialPriceMap = new Map<string, number>([
      ['Moose Antler', 121.1],
      ['Air Elemental Essence', 277.9],
      ['Ruined Robes', 23],
      ['Boar Tusk', 404.9],
      ['Turtle', 35], // INCORRECT price (should be 37.6)
    ])

    const results = calculateCraftableProfits(
      [stormbringerRecipeWithBug],
      mockTaxRate,
      materialPriceMap,
      []
    )

    expect(results).toHaveLength(1)
    const result = results[0]

    // With incorrect Turtle price (35):
    // Turtle: 10,000 × 35 = 350,000
    const incorrectTotalCost = 6781.6 + 2779 + 230 + 10122.5 + 350000

    expect(result.totalCost).toBeCloseTo(incorrectTotalCost, 1)
    expect(result.totalCost).toBeCloseTo(369913.1, 1)

    // The difference is 26,000 gold!
    const correctCost = 395913.1
    const difference = correctCost - result.totalCost
    expect(difference).toBeCloseTo(26000, 1)
  })
})
