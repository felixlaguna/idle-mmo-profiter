import type { Dungeon, MagicFindSettings, Recipe } from '../types'

export interface DungeonDropResult {
  recipeName: string
  price: number
  chance: number
  expectedValue: number
}

export interface DungeonProfitResult {
  name: string
  runCost: number
  timeSeconds: number
  drops: DungeonDropResult[]
  totalProfit: number
  profitPerHour: number
}

/**
 * Calculates profit for all dungeons based on Magic Find settings.
 *
 * Formula for each drop:
 * - expected_value = recipe_price * chance * (1 + totalMF/100)
 * - totalMF = mfStreak + mfDung + mfItem + mfBonus
 *
 * Dungeon profit:
 * - profit = SUM(expected_values) - run_cost
 * - profit_per_hour = profit / (time_seconds / 3600)
 *
 * @param dungeons - Array of dungeons with their drops
 * @param recipes - Array of all recipes with prices and chances
 * @param magicFind - Magic Find settings (streak, dungeon, item, bonus)
 * @returns Array of dungeon profit results sorted by profit per hour descending
 */
export function calculateDungeonProfits(
  dungeons: Dungeon[],
  recipes: Recipe[],
  magicFind: MagicFindSettings
): DungeonProfitResult[] {
  // Calculate total Magic Find percentage
  const totalMF = magicFind.streak + magicFind.dungeon + magicFind.item + magicFind.bonus

  // Create a map of recipe names to recipe data for quick lookup
  const recipeMap = new Map<string, Recipe>()
  recipes.forEach((recipe) => {
    recipeMap.set(recipe.name, recipe)
  })

  const results: DungeonProfitResult[] = dungeons.map((dungeon) => {
    // Calculate expected value for each drop
    const dropResults: DungeonDropResult[] = dungeon.drops.map((drop) => {
      const recipe = recipeMap.get(drop.recipeName)

      if (!recipe) {
        // Recipe not found - return zero values
        return {
          recipeName: drop.recipeName,
          price: 0,
          chance: 0,
          expectedValue: 0,
        }
      }

      // Formula: expected_value = price * chance * (1 + totalMF/100)
      const expectedValue = recipe.price * recipe.chance * (1 + totalMF / 100)

      return {
        recipeName: drop.recipeName,
        price: recipe.price,
        chance: recipe.chance,
        expectedValue,
      }
    })

    // Sum all drop expected values
    const totalExpectedValue = dropResults.reduce((sum, drop) => sum + drop.expectedValue, 0)

    // Calculate profit
    const totalProfit = totalExpectedValue - dungeon.runCost

    // Calculate profit per hour
    const profitPerHour = totalProfit / (dungeon.timeSeconds / 3600)

    return {
      name: dungeon.name,
      runCost: dungeon.runCost,
      timeSeconds: dungeon.timeSeconds,
      drops: dropResults,
      totalProfit,
      profitPerHour,
    }
  })

  // Sort by profit per hour descending
  return results.sort((a, b) => b.profitPerHour - a.profitPerHour)
}
