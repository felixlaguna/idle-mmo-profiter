import { computed, type ComputedRef } from 'vue'
import type { Dungeon, Recipe, CraftableRecipe, ResourceGather, MagicFindSettings } from '../types'
import type { RankedActivity } from '../calculators/profitRanker'
import {
  calculateDungeonProfits,
  calculateCraftableProfits,
  calculateResourceProfits,
  rankAllActivities,
  getBestAction,
} from '../calculators'

export interface UseProfitRankingOptions {
  dungeons: ComputedRef<Dungeon[]> | Dungeon[]
  recipes: ComputedRef<Recipe[]> | Recipe[]
  craftableRecipes: ComputedRef<CraftableRecipe[]> | CraftableRecipe[]
  resourceGathering: ComputedRef<ResourceGather[]> | ResourceGather[]
  magicFind: ComputedRef<MagicFindSettings> | MagicFindSettings
  taxRate: ComputedRef<number> | number
  includeNegative?: ComputedRef<boolean> | boolean
}

export interface UseProfitRankingReturn {
  rankedActivities: ComputedRef<RankedActivity[]>
  bestAction: ComputedRef<RankedActivity | null>
}

/**
 * Vue composable for reactive profit ranking calculations.
 *
 * Takes data sources and settings as inputs (can be refs or raw values),
 * returns reactive computed properties for ranked activities and best action.
 *
 * @param options - Configuration with data sources and settings
 * @returns Reactive profit ranking results
 */
export function useProfitRanking(options: UseProfitRankingOptions): UseProfitRankingReturn {
  const {
    dungeons,
    recipes,
    craftableRecipes,
    resourceGathering,
    magicFind,
    taxRate,
    includeNegative = false,
  } = options

  // Helper to unwrap ref or value
  const unwrap = <T>(value: ComputedRef<T> | T): T => {
    // Check if it's a ComputedRef by checking if it has a value property
    if (value && typeof value === 'object' && 'value' in value) {
      return (value as ComputedRef<T>).value
    }
    return value as T
  }

  const rankedActivities = computed(() => {
    // Get current values
    const currentDungeons = unwrap(dungeons)
    const currentRecipes = unwrap(recipes)
    const currentCraftableRecipes = unwrap(craftableRecipes)
    const currentResourceGathering = unwrap(resourceGathering)
    const currentMagicFind = unwrap(magicFind)
    const currentTaxRate = unwrap(taxRate)
    const currentIncludeNegative = unwrap(includeNegative)

    // Calculate profits for each category
    const dungeonResults = calculateDungeonProfits(
      currentDungeons,
      currentRecipes,
      currentMagicFind
    )
    const craftableResults = calculateCraftableProfits(
      currentCraftableRecipes,
      currentTaxRate,
      currentRecipes
    )
    const resourceResults = calculateResourceProfits(currentResourceGathering, currentTaxRate)

    // Rank all activities
    return rankAllActivities(
      dungeonResults,
      craftableResults,
      resourceResults,
      currentIncludeNegative
    )
  })

  const bestAction = computed(() => {
    return getBestAction(rankedActivities.value)
  })

  return {
    rankedActivities,
    bestAction,
  }
}
