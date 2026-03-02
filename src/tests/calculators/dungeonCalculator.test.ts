/**
 * Tests for dungeon calculator with untradable limited-use recipe pricing
 *
 * This test suite verifies the complete flow:
 * 1. useRecipePricing computes prices for untradable recipes based on craftable profitability
 * 2. calculateDungeonProfits uses these computed prices in expected value calculations
 *
 * Key requirements tested:
 * - Untradable recipes with limited uses get computed price = uses × craftable_profit
 * - Craftable profit does NOT include recipe cost (only material costs)
 * - Negative craftable profit results in price = 0
 * - Untradable recipes without uses field are not affected
 * - Tradable recipes keep their market price
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useRecipePricing } from '../../composables/useRecipePricing'
import { calculateDungeonProfits } from '../../calculators/dungeonCalculator'
import type { Recipe, CraftableRecipe, Dungeon, MagicFindSettings } from '../../types'

describe('Dungeon pricing for untradable limited-use recipes', () => {
  const mockTaxRate = 0.12

  // Mock craftable with known profit
  const profitableCraftable: CraftableRecipe = {
    name: 'Wraithbane',
    timeSeconds: 1090.9,
    materials: [
      { name: 'Moose antler', quantity: 15 },
      { name: 'Minotaur Hide', quantity: 20 },
    ],
    currentPrice: 11894.6,
  }

  // Material cost: (15 * 114.1) + (20 * 378.9) = 1711.5 + 7578 = 9289.5
  // Sell after tax: 11894.6 * 0.88 = 10467.248
  // Craftable profit: 10467.248 - 9289.5 = 1177.748

  // Mock craftable with negative profit
  const unprofitableCraftable: CraftableRecipe = {
    name: 'Failed Brew',
    timeSeconds: 1000,
    materials: [{ name: 'Expensive Ingredient', quantity: 10 }],
    currentPrice: 5000,
  }

  // Material cost: 10 * 1000 = 10000
  // Sell after tax: 5000 * 0.88 = 4400
  // Craftable profit: 4400 - 10000 = -5600 (negative)

  // Material price map for tests
  const mockMaterialPriceMap = new Map<string, number>([
    ['Moose antler', 114.1],
    ['Minotaur Hide', 378.9],
    ['Expensive Ingredient', 1000],
  ])

  const mockMagicFind: MagicFindSettings = {
    streak: 0,
    dungeon: 0,
    item: 0,
    bonus: 0,
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
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([profitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: uses × craftable_profit = 10 × 1177.748 = 11777.48
      const expectedPrice = 10 * 1177.748
      expect(result.price).toBeCloseTo(expectedPrice, 2)
      expect(result.isUntradable).toBe(true)
    })

    it('should set price to 0 when craftable profit is negative', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-999',
          name: 'Failed Brew Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          uses: 10,
          producesItemName: 'Failed Brew',
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([unprofitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
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
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([profitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
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
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([profitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
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
          isUntradable: false,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([profitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays as market price
      expect(result.price).toBe(1213888.8)
      expect(result.isUntradable).toBe(false)
    })

    it('should not compute price when producesItemName does not match any craftable', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-666',
          name: 'Unknown Craftable Recipe (Untradable)',
          price: 0,
          chance: 0.01,
          uses: 10,
          producesItemName: 'NonExistentCraftable',
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([profitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (craftable not found in crafts)
      expect(result.price).toBe(0)
    })
  })

  describe('calculateDungeonProfits - integration with computed prices', () => {
    it('should use computed price in dungeon expected value calculation', () => {
      // Setup: untradable recipe with uses=10, craftable profit = 1177.748
      // Expected computed price: 10 × 1177.748 = 11777.48
      const recipes: Recipe[] = [
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 11777.48, // Pre-computed by useRecipePricing
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true,
        },
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 1000,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 }],
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
          isUntradable: true,
        },
        // Tradable with market price
        {
          id: 'rec-161',
          name: 'Wraithbane Essence Recipe',
          price: 1213888.8,
          chance: 0.0042,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: false,
        },
      ]

      const dungeon: Dungeon = {
        name: 'Mixed Drops Dungeon',
        runCost: 5000,
        timeSeconds: 3600,
        numDrops: 2,
        drops: [
          { recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 },
          { recipeName: 'Wraithbane Essence Recipe', expectedValue: 0 },
        ],
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
          isUntradable: true,
        },
      ]

      const dungeon: Dungeon = {
        name: 'Unprofitable Dungeon',
        runCost: 1000,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Failed Brew Recipe (Untradable)', expectedValue: 0 }],
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
          isUntradable: true,
        },
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 1000,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Wraithbane Essence Recipe (Untradable)', expectedValue: 0 }],
      }

      const magicFind: MagicFindSettings = {
        streak: 10,
        dungeon: 5,
        item: 3,
        bonus: 2,
      }

      // Total MF = 10 + 5 + 3 + 2 = 20%
      const results = calculateDungeonProfits([dungeon], recipes, magicFind)

      expect(results).toHaveLength(1)
      const result = results[0]

      // Expected value: price × chance × (1 + MF/100)
      // 11777.48 × 0.0133 × 1.20 = 187.97...
      const expectedValue = 11777.48 * 0.0133 * 1.2
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
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([profitableCraftable])
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (no producesItemName to match)
      expect(result.price).toBe(0)
    })

    it('should handle empty craftable recipes array', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 0,
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true,
        },
      ]

      const recipesRef = ref(recipes)
      const craftableRecipesRef = ref([]) // Empty craftable recipes
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
      )

      const result = recipesWithComputedPrices.value[0]

      // Expected: price stays 0 (no matching craftable in profitMap)
      expect(result.price).toBe(0)
    })

    it('should reactively update when craftable price changes', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-163',
          name: 'Wraithbane Essence Recipe (Untradable)',
          price: 0,
          chance: 0.0133,
          uses: 10,
          producesItemName: 'Wraithbane',
          isUntradable: true,
        },
      ]

      const craftableRecipe = { ...profitableCraftable }
      const craftableRecipesRef = ref([craftableRecipe])
      const recipesRef = ref(recipes)
      const taxRateRef = ref(mockTaxRate)

      const materialPriceMapRef = ref(mockMaterialPriceMap)

      const { recipesWithComputedPrices } = useRecipePricing(
        recipesRef,
        craftableRecipesRef,
        taxRateRef,
        materialPriceMapRef
      )

      const initialPrice = recipesWithComputedPrices.value[0].price

      // Change craftable price
      craftableRecipesRef.value[0].currentPrice = 20000

      // New calculation:
      // Sell after tax: 20000 * 0.88 = 17600
      // Craftable profit: 17600 - 9289.5 = 8310.5
      // Computed price: 10 * 8310.5 = 83105
      const newPrice = recipesWithComputedPrices.value[0].price

      expect(newPrice).not.toBe(initialPrice)
      expect(newPrice).toBeCloseTo(83105, 2)
    })
  })

  describe('low-confidence detection', () => {
    it('should mark dungeon as low-confidence when any drop has no lastSaleAt', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Drop A',
          price: 1000,
          chance: 0.1,
          // No lastSaleAt
        },
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Drop A', expectedValue: 0 }],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      expect(results[0].isLowConfidence).toBe(true)
      expect(results[0].drops[0].isLowConfidence).toBe(true)
    })

    it('should mark dungeon as low-confidence when any drop has stale lastSaleAt', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45) // 45 days ago

      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Drop A',
          price: 1000,
          chance: 0.1,
          lastSaleAt: oldDate.toISOString(),
        },
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Drop A', expectedValue: 0 }],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      expect(results[0].isLowConfidence).toBe(true)
      expect(results[0].drops[0].isLowConfidence).toBe(true)
    })

    it('should NOT mark dungeon as low-confidence when all drops have recent sales', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Drop A',
          price: 1000,
          chance: 0.1,
          lastSaleAt: recentDate.toISOString(),
        },
        {
          id: 'rec-2',
          name: 'Drop B',
          price: 500,
          chance: 0.2,
          lastSaleAt: recentDate.toISOString(),
        },
      ]

      const dungeon: Dungeon = {
        name: 'Test Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 2,
        drops: [
          { recipeName: 'Drop A', expectedValue: 0 },
          { recipeName: 'Drop B', expectedValue: 0 },
        ],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      expect(results[0].isLowConfidence).toBe(false)
      expect(results[0].drops[0].isLowConfidence).toBe(false)
      expect(results[0].drops[1].isLowConfidence).toBe(false)
    })

    it('should mark dungeon as low-confidence if even one drop is low-confidence', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45) // 45 days ago

      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Fresh Drop',
          price: 1000,
          chance: 0.1,
          lastSaleAt: recentDate.toISOString(),
        },
        {
          id: 'rec-2',
          name: 'Stale Drop',
          price: 500,
          chance: 0.2,
          lastSaleAt: oldDate.toISOString(), // Low confidence
        },
      ]

      const dungeon: Dungeon = {
        name: 'Mixed Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 2,
        drops: [
          { recipeName: 'Fresh Drop', expectedValue: 0 },
          { recipeName: 'Stale Drop', expectedValue: 0 },
        ],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      // Dungeon is low-confidence because ONE drop is low-confidence
      expect(results[0].isLowConfidence).toBe(true)
      // Individual drops have correct flags
      expect(results[0].drops[0].isLowConfidence).toBe(false)
      expect(results[0].drops[1].isLowConfidence).toBe(true)
    })

    it('should mark missing recipe as low-confidence', () => {
      const dungeon: Dungeon = {
        name: 'Missing Recipe Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Nonexistent Drop', expectedValue: 0 }],
      }

      const results = calculateDungeonProfits([dungeon], [], mockMagicFind)

      expect(results).toHaveLength(1)
      expect(results[0].isLowConfidence).toBe(true)
      expect(results[0].drops[0].isLowConfidence).toBe(true)
    })

    it('should NOT mark dungeon as low-confidence when only untradable drops have no sales', () => {
      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Untradable Drop',
          price: 1000,
          chance: 0.1,
          isUntradable: true,
          // No lastSaleAt - but this is expected for untradable items
        },
      ]

      const dungeon: Dungeon = {
        name: 'Untradable Only Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 1,
        drops: [{ recipeName: 'Untradable Drop', expectedValue: 0 }],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      // Dungeon should be high-confidence because untradable drops don't count
      expect(results[0].isLowConfidence).toBe(false)
      // Individual drop should also NOT be marked as low-confidence
      expect(results[0].drops[0].isLowConfidence).toBe(false)
    })

    it('should NOT mark dungeon as low-confidence with mix of tradable (high-conf) + untradable drops', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Tradable Drop',
          price: 1000,
          chance: 0.1,
          lastSaleAt: recentDate.toISOString(),
          isUntradable: false,
        },
        {
          id: 'rec-2',
          name: 'Untradable Drop',
          price: 500,
          chance: 0.2,
          isUntradable: true,
          // No lastSaleAt - but this is expected for untradable items
        },
      ]

      const dungeon: Dungeon = {
        name: 'Mixed Dungeon',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 2,
        drops: [
          { recipeName: 'Tradable Drop', expectedValue: 0 },
          { recipeName: 'Untradable Drop', expectedValue: 0 },
        ],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      // Dungeon should be high-confidence because:
      // - Tradable drop has recent sales (high-conf)
      // - Untradable drop doesn't count for confidence
      expect(results[0].isLowConfidence).toBe(false)
      expect(results[0].drops[0].isLowConfidence).toBe(false)
      expect(results[0].drops[1].isLowConfidence).toBe(false)
    })

    it('should mark dungeon as low-confidence when tradable drop is low-confidence', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45) // 45 days ago

      const recipes: Recipe[] = [
        {
          id: 'rec-1',
          name: 'Stale Tradable Drop',
          price: 1000,
          chance: 0.1,
          lastSaleAt: oldDate.toISOString(),
          isUntradable: false,
        },
        {
          id: 'rec-2',
          name: 'Untradable Drop',
          price: 500,
          chance: 0.2,
          isUntradable: true,
          // No lastSaleAt - but this is expected for untradable items
        },
      ]

      const dungeon: Dungeon = {
        name: 'Mixed Dungeon with Stale Tradable',
        runCost: 100,
        timeSeconds: 3600,
        numDrops: 2,
        drops: [
          { recipeName: 'Stale Tradable Drop', expectedValue: 0 },
          { recipeName: 'Untradable Drop', expectedValue: 0 },
        ],
      }

      const results = calculateDungeonProfits([dungeon], recipes, mockMagicFind)

      expect(results).toHaveLength(1)
      // Dungeon should be low-confidence because tradable drop is low-confidence
      expect(results[0].isLowConfidence).toBe(true)
      // Individual tradable drop should be marked as low-confidence
      expect(results[0].drops[0].isLowConfidence).toBe(true)
      // Untradable drop should NOT be marked as low-confidence
      expect(results[0].drops[1].isLowConfidence).toBe(false)
    })
  })
})
