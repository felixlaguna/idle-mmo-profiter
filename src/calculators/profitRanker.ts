import type { ActivityType } from '../types'
import type { DungeonProfitResult } from './dungeonCalculator'
import type { PotionProfitResult } from './potionCalculator'
import type { ResourceProfitResult } from './resourceCalculator'

export interface RankedActivity {
  rank: number
  activityType: ActivityType
  name: string
  profitPerHour: number
  profitPerAction: number
  timePerAction: number
  cost: number
  details: string
  isRecommended: boolean
}

/**
 * Combines and ranks all profit-generating activities from dungeons, potions, and resources.
 *
 * @param dungeonResults - Results from dungeon calculator
 * @param potionResults - Results from potion calculator
 * @param resourceResults - Results from resource calculator
 * @param includeNegative - Whether to include activities with negative profit (default: false)
 * @returns Array of ranked activities sorted by profit per hour descending
 */
export function rankAllActivities(
  dungeonResults: DungeonProfitResult[],
  potionResults: PotionProfitResult[],
  resourceResults: ResourceProfitResult[],
  includeNegative = false
): RankedActivity[] {
  const allActivities: Omit<RankedActivity, 'rank' | 'isRecommended'>[] = []

  // Add dungeon results
  dungeonResults.forEach(dungeon => {
    allActivities.push({
      activityType: 'dungeon',
      name: dungeon.name,
      profitPerHour: dungeon.profitPerHour,
      profitPerAction: dungeon.totalProfit,
      timePerAction: dungeon.timeSeconds,
      cost: dungeon.runCost,
      details: `${dungeon.drops.length} drops, ${Math.round(dungeon.timeSeconds / 60)} min run`
    })
  })

  // Add potion results
  potionResults.forEach(potion => {
    allActivities.push({
      activityType: 'potion',
      name: potion.name,
      profitPerHour: potion.profitPerHour,
      profitPerAction: potion.profit,
      timePerAction: potion.craftTimeSeconds,
      cost: potion.totalCost,
      details: `${potion.materials.length} materials, ${Math.round(potion.craftTimeSeconds / 60)} min craft`
    })
  })

  // Add resource results
  resourceResults.forEach(resource => {
    allActivities.push({
      activityType: 'resource',
      name: resource.name,
      profitPerHour: resource.bestProfitPerHour,
      profitPerAction: resource.bestProfit,
      timePerAction: resource.timeSeconds,
      cost: resource.cost,
      details: `Best: ${resource.bestMethod}, ${Math.round(resource.timeSeconds)} sec`
    })
  })

  // Filter out negative profits if requested
  let filteredActivities = allActivities
  if (!includeNegative) {
    filteredActivities = allActivities.filter(activity => activity.profitPerHour > 0)
  }

  // Sort by profit per hour descending
  const sortedActivities = filteredActivities.sort((a, b) => b.profitPerHour - a.profitPerHour)

  // Add rank and mark the best activity as recommended
  const rankedActivities: RankedActivity[] = sortedActivities.map((activity, index) => ({
    ...activity,
    rank: index + 1,
    isRecommended: index === 0
  }))

  return rankedActivities
}

/**
 * Gets the best (most profitable) activity from the ranked list.
 *
 * @param rankedActivities - Array of ranked activities
 * @returns The top-ranked activity or null if no activities
 */
export function getBestAction(rankedActivities: RankedActivity[]): RankedActivity | null {
  return rankedActivities.length > 0 ? rankedActivities[0] : null
}
