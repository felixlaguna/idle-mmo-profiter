import type { ResourceGather, ResourceSkill } from '../types'

export type SaleMethod = 'vendor' | 'market'

export interface ResourceProfitResult {
  name: string
  timeSeconds: number
  cost: number
  vendorValue: number
  marketPrice: number
  vendorProfit: number
  vendorProfitPerHour: number
  marketProfit: number
  marketProfitPerHour: number
  bestMethod: SaleMethod
  bestProfit: number
  bestProfitPerHour: number
}

/**
 * Function to get efficiency-modified craft time for a resource
 * This is optional and allows the calculator to remain pure
 */
export type EfficiencyModifierFn = (baseTimeSeconds: number, skill: ResourceSkill) => number

/**
 * Calculates profit for all resource gathering activities.
 *
 * Formula:
 * - vendor_profit = vendor_value - cost
 * - market_profit = (market_price * (1 - taxRate)) - cost
 * - best = MAX(vendor_profit, market_profit)
 * - profit_per_hour = profit / (time_seconds / 3600)
 *
 * Efficiency:
 * - If an efficiency modifier function is provided, it will be applied to craft times
 * - Formula: Final Time = Base Time / ((Efficiency% + 100) / 100)
 * - This affects items/h and profit/h calculations
 *
 * @param resources - Array of resource gathering activities
 * @param taxRate - Market tax rate (e.g., 0.12 for 12%)
 * @param skillMap - Optional map of resource name to skill (for efficiency application)
 * @param efficiencyModifier - Optional function to apply efficiency modifier to craft time
 * @returns Array of resource profit results sorted by best profit per hour descending
 */
export function calculateResourceProfits(
  resources: ResourceGather[],
  taxRate: number,
  skillMap?: Map<string, ResourceSkill>,
  efficiencyModifier?: EfficiencyModifierFn
): ResourceProfitResult[] {
  const results: ResourceProfitResult[] = resources.map((resource) => {
    // Get cost (should always be computed by data provider, but fallback to baseCost)
    const cost = resource.cost ?? resource.baseCost

    // Apply efficiency modifier to craft time if available
    let effectiveTime = resource.timeSeconds
    if (skillMap && efficiencyModifier) {
      const skill = skillMap.get(resource.name)
      if (skill) {
        effectiveTime = efficiencyModifier(resource.timeSeconds, skill)
      }
    }

    // Vendor profit
    const vendorProfit = resource.vendorValue - cost
    const vendorProfitPerHour = vendorProfit / (effectiveTime / 3600)

    // Market profit (after tax)
    const marketAfterTax = resource.marketPrice * (1 - taxRate)
    const marketProfit = marketAfterTax - cost
    const marketProfitPerHour = marketProfit / (effectiveTime / 3600)

    // Determine best method
    const bestMethod: SaleMethod = vendorProfitPerHour > marketProfitPerHour ? 'vendor' : 'market'
    const bestProfit = bestMethod === 'vendor' ? vendorProfit : marketProfit
    const bestProfitPerHour = bestMethod === 'vendor' ? vendorProfitPerHour : marketProfitPerHour

    return {
      name: resource.name,
      timeSeconds: effectiveTime,
      cost,
      vendorValue: resource.vendorValue,
      marketPrice: resource.marketPrice,
      vendorProfit,
      vendorProfitPerHour,
      marketProfit,
      marketProfitPerHour,
      bestMethod,
      bestProfit,
      bestProfitPerHour,
    }
  })

  // Sort by best profit per hour descending
  return results.sort((a, b) => b.bestProfitPerHour - a.bestProfitPerHour)
}
