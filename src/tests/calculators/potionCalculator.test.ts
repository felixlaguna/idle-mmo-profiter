/**
 * Tests for potion profit calculator
 * These tests verify that recipe costs are only applied when appropriate
 *
 * Dual profitability is shown when:
 * 1. A tradable recipe exists for the potion, AND
 * 2. The recipe has limited uses (uses > 0)
 * This lets the user compare: profit with vs without recipe cost
 */

import { describe, it, expect } from 'vitest'
import { calculatePotionProfits } from '../../calculators/potionCalculator'
import type { PotionCraft, Recipe } from '../../types'

describe('calculatePotionProfits', () => {
  const mockTaxRate = 0.12

  const mockPotionCraft: PotionCraft = {
    name: 'Wraithbane',
    timeSeconds: 1090.9,
    materials: [
      { name: 'Moose antler', quantity: 15, unitCost: 114.1 },
      { name: 'Minotaur Hide', quantity: 20, unitCost: 378.9 }
    ],
    currentPrice: 11894.6
  }

  describe('recipe cost logic', () => {
    it('should apply recipe cost when potion has both tradable AND untradable recipes', () => {
      // Wraithbane has both a tradable and untradable recipe
      // Show dual profitability so user can compare free vs bought recipe
      const recipes: Recipe[] = [
        {
          id: 'rec-161',
          name: 'Wraithbane Essence Recipe',
          price: 1213888.8,
          chance: 0.0042,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: false
        },
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 0,
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true
        }
      ]

      const results = calculatePotionProfits([mockPotionCraft], mockTaxRate, recipes)

      expect(results).toHaveLength(1)
      const result = results[0]

      // Dual profitability: main profit = with recipe cost, tooltip shows without
      expect(result.hasRecipeCost).toBe(true)
      expect(result.profitWithRecipeCost).toBeDefined()
      expect(result.profitPerHourWithRecipeCost).toBeDefined()
      expect(result.recipeCostPerCraft).toBe(1213888.8 / 10)
    })

    it('should apply recipe cost when potion has tradable recipe with uses > 0 (even without untradable alternative)', () => {
      // Any potion with a tradable recipe with limited uses shows dual profitability
      const potionCraft: PotionCraft = {
        name: 'Exclusive Elixir',
        timeSeconds: 1000,
        materials: [
          { name: 'Rare Herb', quantity: 10, unitCost: 100 }
        ],
        currentPrice: 5000
      }

      const recipes: Recipe[] = [
        {
          id: 'rec-999',
          name: 'Exclusive Elixir Recipe',
          price: 10000,
          chance: 0.01,
          uses: 10,
          producesItemName: 'Exclusive Elixir',
          isUntradable: false
        }
        // Note: NO untradable version exists
      ]

      const results = calculatePotionProfits([potionCraft], mockTaxRate, recipes)

      expect(results).toHaveLength(1)
      const result = results[0]

      expect(result.hasRecipeCost).toBe(true)
      expect(result.profitWithRecipeCost).toBeDefined()
      expect(result.profitPerHourWithRecipeCost).toBeDefined()
      expect(result.recipeCostPerCraft).toBe(10000 / 10)
    })

    it('should NOT apply recipe cost when tradable recipe has uses = 0', () => {
      // uses=0 means unlimited/untracked uses, no dual profitability needed
      const potionCraft: PotionCraft = {
        name: 'Unlimited Potion',
        timeSeconds: 1000,
        materials: [
          { name: 'Common Herb', quantity: 5, unitCost: 50 }
        ],
        currentPrice: 3000
      }

      const recipes: Recipe[] = [
        {
          id: 'rec-998',
          name: 'Unlimited Potion Recipe',
          price: 5000,
          chance: 0.05,
          uses: 0, // Unlimited uses
          producesItemName: 'Unlimited Potion',
          isUntradable: false
        }
      ]

      const results = calculatePotionProfits([potionCraft], mockTaxRate, recipes)

      expect(results).toHaveLength(1)
      const result = results[0]

      expect(result.hasRecipeCost).toBe(false)
      expect(result.profitWithRecipeCost).toBeUndefined()
      expect(result.profitPerHourWithRecipeCost).toBeUndefined()
    })

    it('should NOT apply recipe cost when potion has no recipes at all', () => {
      const results = calculatePotionProfits([mockPotionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      const result = results[0]

      expect(result.hasRecipeCost).toBe(false)
      expect(result.profitWithRecipeCost).toBeUndefined()
    })

    it('should NOT apply recipe cost when potion has ONLY untradable recipe', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 0,
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true
        }
      ]

      const results = calculatePotionProfits([mockPotionCraft], mockTaxRate, recipes)

      expect(results).toHaveLength(1)
      const result = results[0]

      expect(result.hasRecipeCost).toBe(false)
      expect(result.profitWithRecipeCost).toBeUndefined()
    })
  })

  describe('basic profitability calculations', () => {
    it('should calculate profit correctly without recipe cost', () => {
      const results = calculatePotionProfits([mockPotionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      const result = results[0]

      // Material cost: (15 * 114.1) + (20 * 378.9) = 1711.5 + 7578 = 9289.5
      const expectedTotalCost = 9289.5
      expect(result.totalCost).toBeCloseTo(expectedTotalCost, 2)

      // Min sell price: 9289.5 / (1 - 0.12) = 9289.5 / 0.88 = 10556.25
      const expectedMinSellPrice = expectedTotalCost / (1 - mockTaxRate)
      expect(result.minSellPrice).toBeCloseTo(expectedMinSellPrice, 2)

      // Profit: (11894.6 * 0.88) - 9289.5 = 10467.248 - 9289.5 = 1177.748
      const sellAfterTax = mockPotionCraft.currentPrice * (1 - mockTaxRate)
      const expectedProfit = sellAfterTax - expectedTotalCost
      expect(result.profit).toBeCloseTo(expectedProfit, 2)

      // Profit per hour
      const expectedProfitPerHour = expectedProfit / (mockPotionCraft.timeSeconds / 3600)
      expect(result.profitPerHour).toBeCloseTo(expectedProfitPerHour, 2)
    })
  })

  describe('skill inference', () => {
    it('should pass through skill from PotionCraft when present', () => {
      const potionCraft: PotionCraft = {
        name: 'Alchemy Potion',
        timeSeconds: 1000,
        materials: [
          { name: 'Rare Herb', quantity: 10, unitCost: 100 }
        ],
        currentPrice: 5000,
        skill: 'alchemy'
      }

      const results = calculatePotionProfits([potionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      expect(results[0].skill).toBe('alchemy')
    })

    it('should infer alchemy from Vial material name', () => {
      const potionCraft: PotionCraft = {
        name: 'Mystery Potion',
        timeSeconds: 1000,
        materials: [
          { name: 'Gleaming Vial', quantity: 1, unitCost: 100 },
          { name: 'Rare Herb', quantity: 10, unitCost: 50 }
        ],
        currentPrice: 5000
      }

      const results = calculatePotionProfits([potionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      expect(results[0].skill).toBe('alchemy')
    })

    it('should infer alchemy from Crystal material name', () => {
      const potionCraft: PotionCraft = {
        name: 'Crystal Potion',
        timeSeconds: 1000,
        materials: [
          { name: 'Elemental Crystal', quantity: 1, unitCost: 200 },
          { name: 'Metal Bar', quantity: 5, unitCost: 100 }
        ],
        currentPrice: 8000
      }

      const results = calculatePotionProfits([potionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      expect(results[0].skill).toBe('alchemy')
    })

    it('should default to forging when no Vial or Crystal in materials', () => {
      const potionCraft: PotionCraft = {
        name: 'Forged Item',
        timeSeconds: 1000,
        materials: [
          { name: 'Moose antler', quantity: 15, unitCost: 100 },
          { name: 'Minotaur Hide', quantity: 20, unitCost: 200 }
        ],
        currentPrice: 10000
      }

      const results = calculatePotionProfits([potionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      expect(results[0].skill).toBe('forging')
    })

    it('should prefer explicit skill over inferred skill', () => {
      const potionCraft: PotionCraft = {
        name: 'Edge Case Potion',
        timeSeconds: 1000,
        materials: [
          { name: 'Gleaming Vial', quantity: 1, unitCost: 100 },
          { name: 'Rare Material', quantity: 5, unitCost: 50 }
        ],
        currentPrice: 5000,
        skill: 'forging' // Explicit skill differs from what would be inferred
      }

      const results = calculatePotionProfits([potionCraft], mockTaxRate, [])

      expect(results).toHaveLength(1)
      expect(results[0].skill).toBe('forging') // Should use explicit skill, not inferred 'alchemy'
    })
  })
})
