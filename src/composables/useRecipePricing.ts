/**
 * Recipe Pricing Composable
 *
 * Computes prices for untradable recipes based on potion profitability.
 *
 * Formula for untradable recipes (price === 0):
 *   computed_price = uses × potion_profit
 *   potion_profit = potion_price_after_tax - potion_craft_cost
 *   potion_price_after_tax = potion_price × (1 - taxRate)
 *
 * This composable bridges the gap between the data provider and calculators,
 * enriching recipe data with computed prices based on potion economics.
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import type { Recipe, PotionCraft } from '../types'

interface PotionProfitMap {
  [potionName: string]: number
}

/**
 * Calculate potion profit for a single potion craft
 *
 * @param craft - The potion craft data
 * @param taxRate - Market tax rate
 * @returns Profit per potion after tax and material costs
 */
function calculatePotionProfit(craft: PotionCraft, taxRate: number): number {
  // Calculate total material cost
  const totalMaterialCost = craft.materials.reduce(
    (sum, mat) => sum + mat.quantity * mat.unitCost,
    0
  )

  // Total cost
  const totalCost = totalMaterialCost

  // Current market price after tax
  const sellAfterTax = craft.currentPrice * (1 - taxRate)

  // Profit = what we get after tax - what we spent
  return sellAfterTax - totalCost
}

/**
 * Create a map of potion names to their profit values
 *
 * @param potionCrafts - Array of potion craft data
 * @param taxRate - Market tax rate
 * @returns Map of potion name to profit per craft
 */
function createPotionProfitMap(potionCrafts: PotionCraft[], taxRate: number): PotionProfitMap {
  const map: PotionProfitMap = {}

  potionCrafts.forEach((craft) => {
    map[craft.name] = calculatePotionProfit(craft, taxRate)
  })

  return map
}

/**
 * Composable to compute recipe prices with untradable recipe pricing
 *
 * @param recipes - Reactive reference to recipe data
 * @param potionCrafts - Reactive reference to potion craft data
 * @param taxRate - Reactive reference to market tax rate
 * @returns Computed reference to recipes with computed prices for untradable recipes
 */
export function useRecipePricing(
  recipes: Ref<Recipe[]> | ComputedRef<Recipe[]>,
  potionCrafts: Ref<PotionCraft[]> | ComputedRef<PotionCraft[]>,
  taxRate: Ref<number> | ComputedRef<number>
) {
  /**
   * Recipes with computed prices for untradable recipes
   *
   * For untradable recipes (price === 0 or isUntradable === true):
   * - If the recipe produces a potion that has craft data, compute price as uses × potion_profit
   * - Otherwise, keep price as 0
   *
   * For tradable recipes:
   * - Keep the original market price
   */
  const recipesWithComputedPrices = computed(() => {
    // Create profit map for potions
    const profitMap = createPotionProfitMap(potionCrafts.value, taxRate.value)

    return recipes.value.map((recipe) => {
      // If recipe is not untradable or already has a price, return as is
      if (!recipe.isUntradable && recipe.price > 0) {
        return recipe
      }

      // Recipe is untradable - attempt to compute price
      // Only compute price for recipes with limited uses
      if (!recipe.uses || recipe.uses <= 0) {
        return recipe
      }

      const uses = recipe.uses
      const producesItemName = recipe.producesItemName

      // If we know what potion this recipe produces, compute the price
      if (producesItemName && profitMap[producesItemName] !== undefined) {
        const potionProfit = profitMap[producesItemName]

        // Only compute price if potion is profitable
        // If potion profit is negative, recipe has no value (or minimal vendor value)
        const computedPrice = potionProfit > 0 ? uses * potionProfit : 0

        return {
          ...recipe,
          price: computedPrice,
        }
      }

      // If we don't know what this recipe produces, return as is
      return recipe
    })
  })

  return {
    recipesWithComputedPrices,
  }
}
