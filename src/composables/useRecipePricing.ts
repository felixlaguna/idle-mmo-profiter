/**
 * Recipe Pricing Composable
 *
 * Computes prices for untradable recipes based on craftable profitability.
 *
 * Formula for untradable recipes (price === 0):
 *   computed_price = uses × craftable_profit
 *   craftable_profit = craftable_price_after_tax - craftable_craft_cost
 *   craftable_price_after_tax = craftable_price × (1 - taxRate)
 *
 * This composable bridges the gap between the data provider and calculators,
 * enriching recipe data with computed prices based on craftable economics.
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import type { Recipe, CraftableRecipe } from '../types'

interface CraftableProfitMap {
  [craftableName: string]: number
}

/**
 * Calculate craftable profit for a single craftable recipe
 *
 * @param craft - The craftable recipe data
 * @param taxRate - Market tax rate
 * @returns Profit per craftable after tax and material costs
 */
function calculateCraftableProfit(craft: CraftableRecipe, taxRate: number): number {
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
 * Create a map of craftable names to their profit values
 *
 * @param craftableRecipes - Array of craftable recipe data
 * @param taxRate - Market tax rate
 * @returns Map of craftable name to profit per craft
 */
function createCraftableProfitMap(
  craftableRecipes: CraftableRecipe[],
  taxRate: number
): CraftableProfitMap {
  const map: CraftableProfitMap = {}

  craftableRecipes.forEach((craft) => {
    map[craft.name] = calculateCraftableProfit(craft, taxRate)
  })

  return map
}

/**
 * Composable to compute recipe prices with untradable recipe pricing
 *
 * @param recipes - Reactive reference to recipe data
 * @param craftableRecipes - Reactive reference to craftable recipe data
 * @param taxRate - Reactive reference to market tax rate
 * @returns Computed reference to recipes with computed prices for untradable recipes
 */
export function useRecipePricing(
  recipes: Ref<Recipe[]> | ComputedRef<Recipe[]>,
  craftableRecipes: Ref<CraftableRecipe[]> | ComputedRef<CraftableRecipe[]>,
  taxRate: Ref<number> | ComputedRef<number>
) {
  /**
   * Recipes with computed prices for untradable recipes
   *
   * For untradable recipes (price === 0 or isUntradable === true):
   * - If the recipe produces a craftable that has craft data, compute price as uses × craftable_profit
   * - Otherwise, keep price as 0
   *
   * For tradable recipes:
   * - Keep the original market price
   */
  const recipesWithComputedPrices = computed(() => {
    // Create profit map for craftables
    const profitMap = createCraftableProfitMap(craftableRecipes.value, taxRate.value)

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

      // If we know what craftable this recipe produces, compute the price
      if (producesItemName && profitMap[producesItemName] !== undefined) {
        const craftableProfit = profitMap[producesItemName]

        // Only compute price if craftable is profitable
        // If craftable profit is negative, recipe has no value (or minimal vendor value)
        const computedPrice = craftableProfit > 0 ? uses * craftableProfit : 0

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
