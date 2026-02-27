/**
 * Tests for potion profit calculator
 * These tests verify that recipe costs are only applied when appropriate
 *
 * Dual profitability is shown when:
 * 1. An untradable recipe exists (free from dungeon drops), AND
 * 2. A tradable recipe also exists with limited uses (uses > 0)
 * This lets the user compare: free untradable recipe vs buying the tradable version
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

    it('should NOT apply recipe cost when potion has ONLY tradable recipe (no untradable alternative)', () => {
      // No untradable alternative means no dual profitability comparison needed
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
})
