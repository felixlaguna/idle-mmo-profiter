import type { ResourceGather } from '../types'

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
 * Calculates profit for all resource gathering activities.
 *
 * Formula:
 * - vendor_profit = vendor_value - cost
 * - market_profit = (market_price * (1 - taxRate)) - cost
 * - best = MAX(vendor_profit, market_profit)
 * - profit_per_hour = profit / (time_seconds / 3600)
 *
 * @param resources - Array of resource gathering activities
 * @param taxRate - Market tax rate (e.g., 0.12 for 12%)
 * @returns Array of resource profit results sorted by best profit per hour descending
 */
export function calculateResourceProfits(
  resources: ResourceGather[],
  taxRate: number
): ResourceProfitResult[] {
  const results: ResourceProfitResult[] = resources.map((resource) => {
    // Get cost (should always be computed by data provider, but fallback to baseCost)
    const cost = resource.cost ?? resource.baseCost

    // Vendor profit
    const vendorProfit = resource.vendorValue - cost
    const vendorProfitPerHour = vendorProfit / (resource.timeSeconds / 3600)

    // Market profit (after tax)
    const marketAfterTax = resource.marketPrice * (1 - taxRate)
    const marketProfit = marketAfterTax - cost
    const marketProfitPerHour = marketProfit / (resource.timeSeconds / 3600)

    // Determine best method
    const bestMethod: SaleMethod = vendorProfitPerHour > marketProfitPerHour ? 'vendor' : 'market'
    const bestProfit = bestMethod === 'vendor' ? vendorProfit : marketProfit
    const bestProfitPerHour = bestMethod === 'vendor' ? vendorProfitPerHour : marketProfitPerHour

    return {
      name: resource.name,
      timeSeconds: resource.timeSeconds,
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
