/**
 * Tests for dungeon calculator with untradable limited-use recipe pricing
 *
 * This test suite verifies the complete flow:
 * 1. useRecipePricing computes prices for untradable recipes based on potion profitability
 * 2. calculateDungeonProfits uses these computed prices in expected value calculations
 *
 * Key requirements tested:
 * - Untradable recipes with limited uses get computed price = uses × potion_profit
 * - Potion profit does NOT include recipe cost (only material costs)
 * - Negative potion profit results in price = 0
 * - Untradable recipes without uses field are not affected
 * - Tradable recipes keep their market price
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useRecipePricing } from '../../composables/useRecipePricing'
import { calculateDungeonProfits } from '../../calculators/dungeonCalculator'
import type { Recipe, PotionCraft, Dungeon, MagicFindSettings } from '../../types'

describe('Dungeon pricing for untradable limited-use recipes', () => {
  const mockTaxRate = 0.12

  // Mock potion craft with known profit
  const profitablePotion: PotionCraft = {
    name: 'Wraithbane',
    timeSeconds: 1090.9,
    materials: [
      { name: 'Moose antler', quantity: 15, unitCost: 114.1 },
      { name: 'Minotaur Hide', quantity: 20, unitCost: 378.9 }
    ],
    currentPrice: 11894.6
  }

  // Material cost: (15 * 114.1) + (20 * 378.9) = 1711.5 + 7578 = 9289.5
  // Sell after tax: 11894.6 * 0.88 = 10467.248
  // Potion profit: 10467.248 - 9289.5 = 1177.748

  // Mock potion craft with negative profit
  const unprofitablePotion: PotionCraft = {
    name: 'Failed Brew',
    timeSeconds: 1000,
    materials: [
      { name: 'Expensive Ingredient', quantity: 10, unitCost: 1000 }
    ],
    currentPrice: 5000
  }

  // Material cost: 10 * 1000 = 10000
  // Sell after tax: 5000 * 0.88 = 4400
  // Potion profit: 4400 - 10000 = -5600 (negative)

  const mockMagicFind: MagicFindSettings = {
    streak: 0,
    dungeon: 0,
    item: 0,
    bonus: 0
  }

  describe('useRecipePricing - computed price calculation', () => {
    it('should compute price for untradable recipe with uses and producesItemName', () => {
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

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([profitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: uses × potion_profit = 10 × 1177.748 = 11777.48
      const expectedPrice = 10 * 1177.748
      expect(result.price).toBeCloseTo(expectedPrice, 2)
      expect(result.isUntradable).toBe(true)
    })

    it('should set price to 0 when potion profit is negative', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-999',
          name: 'Failed Brew Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          uses: 10,
          producesItemName: 'Failed Brew',
          isUntradable: true
        }
      ]

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([unprofitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price = 0 (not negative)
      expect(result.price).toBe(0)
    })

    it('should not compute price for untradable recipe without uses field', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-888',
          name: 'Infinite Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          // No uses field
          producesItemName: 'Wraithbane',
          isUntradable: true
        }
      ]

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([profitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0
      expect(result.price).toBe(0)
    })

    it('should not compute price for untradable recipe with uses = 0', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-777',
          name: 'Zero Uses Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          uses: 0,
          producesItemName: 'Wraithbane',
          isUntradable: true
        }
      ]

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([profitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (uses must be > 0)
      expect(result.price).toBe(0)
    })

    it('should not affect tradable recipes with market price', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-161',
          name: 'Wraithbane Essence Recipe',
          price: 1213888.8,
          chance: 0.0042,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: false
        }
      ]

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([profitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays as market price
      expect(result.price).toBe(1213888.8)
      expect(result.isUntradable).toBe(false)
    })

    it('should not compute price when producesItemName does not match any potion', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-666',
          name: 'Unknown Potion Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          uses: 10,
          producesItemName: 'NonExistentPotion',
          isUntradable: true
        }
      ]

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([profitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (potion not found in crafts)
      expect(result.price).toBe(0)
    })
  })

  describe('calculateDungeonProfits - integration with computed prices', () => {
    it('should use computed price in dungeon expected value calculation', () => {
      // Setup: untradable recipe with uses=10, potion profit = 1177.748
      // Expected computed price: 10 × 1177.748 = 11777.48
      const recipes: Recipe[] = [
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 11777.48, // Pre-computed by useRecipePricing
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true
        }
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 1000,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [
          { recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 }
        ]
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      const result = results[0]

      // Expected value: price × chance × (1 + MF/100)
      // 11777.48 × 0.0133 × 1 = 156.64...
      const expectedValue = 11777.48 * 0.0133
      expect(result.drops[0].expectedValue).toBeCloseTo(expectedValue, 2)
      expect(result.drops[0].price).toBeCloseTo(11777.48, 2)

      // Total profit: expectedValue - runCost
      const expectedProfit = expectedValue - 1000
      expect(result.totalProfit).toBeCloseTo(expectedProfit, 2)
    })

    it('should correctly calculate dungeon profit with multiple drops including untradable recipes', () => {
      const recipes: Recipe[] = [
        // Untradable with computed price
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 11777.48,
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true
        },
        // Tradable with market price
        {
          id: 'rec-161',
          name: 'Wraithbane Essence Recipe',
          price: 1213888.8,
          chance: 0.0042,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: false
        }
      ]

      const dungeon: Dungeon = {
        name: 'Mixed Drops Dungeon',
        runCost: 5000,
        timeSeconds: 3600,
        numDrops: 2,
        drops: [
          { recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 },
          { recipeName: 'Wraithbane Essence Recipe', expectedValue: 0 }
        ]
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      const result = results[0]

      // Drop 1 expected value: 11777.48 × 0.0133 = 156.64...
      const ev1 = 11777.48 * 0.0133
      expect(result.drops[0].expectedValue).toBeCloseTo(ev1, 2)

      // Drop 2 expected value: 1213888.8 × 0.0042 = 5098.33...
      const ev2 = 1213888.8 * 0.0042
      expect(result.drops[1].expectedValue).toBeCloseTo(ev2, 2)

      // Total expected value
      const totalEV = ev1 + ev2
      const expectedProfit = totalEV - 5000
      expect(result.totalProfit).toBeCloseTo(expectedProfit, 2)
    })

    it('should handle dungeon with untradable recipe that has price = 0 (negative profit)', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-999',
          name: 'Failed Brew Recipe (Untradable)',
          price: 0, // Computed price = 0 due to negative profit
          chance: 0.05,
          uses: 10,
          producesItemName: 'Failed Brew',
          isUntradable: true
        }
      ]

      const dungeon: Dungeon = {
        name: 'Unprofitable Dungeon',
        runCost: 1000,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [
          { recipeName: 'Failed Brew Recipe (Untradable)', expectedValue: 0 }
        ]
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      const result = results[0]

      // Expected value should be 0
      expect(result.drops[0].expectedValue).toBe(0)
      expect(result.drops[0].price).toBe(0)

      // Total profit: 0 - 1000 = -1000 (loss)
      expect(result.totalProfit).toBe(-1000)
    })

    it('should apply Magic Find bonus to computed recipe prices', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 11777.48,
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true
        }
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 1000,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [
          { recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 }
        ]
      }

      const magicFind: MagicFindSettings = {
        streak: 10,
        dungeon: 5,
        item: 3,
        bonus: 2
      }

      // Total MF = 10 + 5 + 3 + 2 = 20%
      const results = calculateDungeonProfits([dungeon], recipes, magicFind)

      expect(results).toHaveLength(1)
      const result = results[0]

      // Expected value: price × chance × (1 + MF/100)
      // 11777.48 × 0.0133 × 1.20 = 187.97...
      const expectedValue = 11777.48 * 0.0133 * 1.20
      expect(result.drops[0].expectedValue).toBeCloseTo(expectedValue, 2)
    })
  })

  describe('edge cases', () => {
    it('should handle untradable recipe with missing producesItemName', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-555',
          name: 'Mystery Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          uses: 10,
          // No producesItemName
          isUntradable: true
        }
      ]

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([profitablePotion])
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (no producesItemName to match)
      expect(result.price).toBe(0)
    })

    it('should handle empty potion crafts array', () => {
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

      const recipesRef = ref(recipes)
      const potionCraftsRef = ref([]) // Empty potion crafts
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (no matching potion in profitMap)
      expect(result.price).toBe(0)
    })

    it('should reactively update when potion price changes', () => {
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

      const potionCraft = { ...profitablePotion }
      const potionCraftsRef = ref([potionCraft])
      const recipesRef = ref(recipes)
      const taxRateRef = ref(mockTaxRate)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        potionCraftsRef,
        taxRateRef
      )

      const initialPrice = recipesWithComputedPrices.value[0].price

      // Change potion price
      potionCraftsRef.value[0].currentPrice = 20000

      // New calculation:
      // Sell after tax: 20000 * 0.88 = 17600
      // Potion profit: 17600 - 9289.5 = 8310.5
      // Computed price: 10 * 8310.5 = 83105
      const newPrice = recipesWithComputedPrices.value[0].price

      expect(newPrice).not.toBe(initialPrice)
      expect(newPrice).toBeCloseTo(83105, 2)
    })
  })
})
