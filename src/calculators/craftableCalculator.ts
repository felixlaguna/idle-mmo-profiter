import type { CraftableRecipe, Recipe, CraftableMaterial } from '../types'

export interface CraftableMaterialResult {
  name: string
  quantity: number
  unitCost: number
  totalCost: number
}

/**
 * Infer crafting skill from material names using a heuristic.
 *
 * Game crafting recipes use vendor-sold containers:
 * - Alchemy: Cheap Vial, Tarnished Vial, Gleaming Vial, Cheap Crystal, Tarnished Crystal, Gleaming Crystal, etc.
 * - Forging: Everything else (no Vial or Crystal ingredients)
 *
 * @param materials - Array of craftable materials
 * @returns 'alchemy' if any material ends with 'Vial' or 'Crystal', 'forging' otherwise
 */
function inferSkillFromMaterials(materials: CraftableMaterial[]): 'alchemy' | 'forging' {
  for (const material of materials) {
    if (material.name.endsWith('Vial') || material.name.endsWith('Crystal')) {
      return 'alchemy'
    }
  }
  return 'forging'
}

export interface CraftableProfitResult {
  name: string
  craftTimeSeconds: number
  materials: CraftableMaterialResult[]
  totalCost: number
  minSellPrice: number
  currentPrice: number
  profit: number
  profitPerHour: number
  hasRecipeCost: boolean
  profitWithRecipeCost?: number
  profitPerHourWithRecipeCost?: number
  recipeCostPerCraft?: number
  recipeUses?: number
  tradableRecipePrice?: number
  tradableRecipeName?: string
  skill?: 'alchemy' | 'forging'
}

/**
 * Calculates profit for all craftable recipes based on material costs and market prices.
 *
 * Formula:
 * - total_cost = SUM(mat_qty * mat_price)
 * - min_sell_price = total_cost + (total_cost * taxRate)
 * - profit = current_price - min_sell_price
 * - profit_per_hour = profit / (craft_time / 3600)
 *
 * Note: The task description says "Benefit = current_price - min_sell_price" but
 * the actual profit should account for tax on the sale:
 * - sell_after_tax = current_price * (1 - taxRate)
 * - profit = sell_after_tax - total_cost
 *
 * However, based on the epic description and Excel logic, it seems the min_sell_price
 * already includes the tax, so we calculate: profit = current_price - min_sell_price
 *
 * Dual Profitability:
 * For craftables that have a tradable recipe with limited uses, compute two
 * profitabilities so the user can compare:
 * 1. Profit WITHOUT recipe cost (crafting without buying the recipe)
 * 2. Profit WITH recipe cost (buying the tradable recipe, amortized over uses)
 *
 * Recipe cost comparison is shown when:
 * - A tradable recipe exists for the craftable, AND
 * - The recipe has limited uses (uses > 0)
 *
 * Formula with recipe cost:
 * - recipe_cost_per_craft = tradable_recipe_price / recipe_uses
 * - profit_with_recipe = profit_without_recipe - recipe_cost_per_craft
 * - profit_per_hour_with_recipe = profit_with_recipe / (craft_time / 3600)
 *
 * @param craftableRecipes - Array of craftable recipes with materials and market prices
 * @param taxRate - Market tax rate (e.g., 0.12 for 12%)
 * @param recipes - Optional array of recipes for dual profitability calculation
 * @returns Array of potion profit results sorted by profit per hour descending
 */
export function calculateCraftableProfits(
  craftableRecipes: CraftableRecipe[],
  taxRate: number,
  recipes?: Recipe[]
): CraftableProfitResult[] {
  // Create a map of craftable names to tradable recipes (if recipes provided)
  const craftableRecipeMap = new Map<string, Recipe>()

  if (recipes) {
    recipes.forEach(recipe => {
      if (!recipe.producesItemName) return

      // Only consider tradable recipes that produce craftables
      if (!recipe.isUntradable && recipe.price > 0) {
        // If multiple recipes produce the same craftable, use the cheapest one
        const existingRecipe = craftableRecipeMap.get(recipe.producesItemName)
        if (!existingRecipe || recipe.price < existingRecipe.price) {
          craftableRecipeMap.set(recipe.producesItemName, recipe)
        }
      }
    })
  }

  const results: CraftableProfitResult[] = craftableRecipes.map(craftable => {
    // Calculate material costs
    const materialResults: CraftableMaterialResult[] = craftable.materials.map(mat => ({
      name: mat.name,
      quantity: mat.quantity,
      unitCost: mat.unitCost,
      totalCost: mat.quantity * mat.unitCost
    }))

    // Calculate total material cost
    const totalMaterialCost = materialResults.reduce(
      (sum, mat) => sum + mat.totalCost,
      0
    )

    // Total cost
    const totalCost = totalMaterialCost

    // Minimum sell price to break even after tax
    // If we sell at minSellPrice, after tax we get: minSellPrice * (1 - taxRate)
    // We want: minSellPrice * (1 - taxRate) = totalCost
    // So: minSellPrice = totalCost / (1 - taxRate)
    const minSellPrice = totalCost / (1 - taxRate)

    // Current market price after tax
    const sellAfterTax = craftable.currentPrice * (1 - taxRate)

    // Profit = what we get after tax - what we spent
    const profit = sellAfterTax - totalCost

    // Profit per hour
    const profitPerHour = profit / (craftable.timeSeconds / 3600)

    // Check if this craftable has a tradable recipe
    const tradableRecipe = craftableRecipeMap.get(craftable.name)

    // Base result
    const result: CraftableProfitResult = {
      name: craftable.name,
      craftTimeSeconds: craftable.timeSeconds,
      materials: materialResults,
      totalCost,
      minSellPrice,
      currentPrice: craftable.currentPrice,
      profit,
      profitPerHour,
      hasRecipeCost: false,
      skill: craftable.skill || inferSkillFromMaterials(craftable.materials)
    }

    // Show dual profitability when:
    // 1. A tradable recipe exists for this craftable, AND
    // 2. The recipe has limited uses (uses > 0)
    if (tradableRecipe && tradableRecipe.uses && tradableRecipe.uses > 0) {
      const recipeCostPerCraft = tradableRecipe.price / tradableRecipe.uses
      const profitWithRecipeCost = profit - recipeCostPerCraft
      const profitPerHourWithRecipeCost = profitWithRecipeCost / (craftable.timeSeconds / 3600)

      result.hasRecipeCost = true
      // Main profit/profitPerHour become the recipe-cost-adjusted values
      result.profit = profitWithRecipeCost
      result.profitPerHour = profitPerHourWithRecipeCost
      // Store the without-recipe values for the tooltip
      result.profitWithRecipeCost = profit
      result.profitPerHourWithRecipeCost = profitPerHour
      result.recipeCostPerCraft = recipeCostPerCraft
      result.recipeUses = tradableRecipe.uses
      result.tradableRecipePrice = tradableRecipe.price
      result.tradableRecipeName = tradableRecipe.name
    }

    return result
  })

  // Sort by profit per hour descending
  return results.sort((a, b) => b.profitPerHour - a.profitPerHour)
}
