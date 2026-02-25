import type { PotionCraft } from '../types'

export interface PotionMaterialResult {
  name: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface PotionProfitResult {
  name: string
  craftTimeSeconds: number
  materials: PotionMaterialResult[]
  vialCost: number
  totalCost: number
  minSellPrice: number
  currentPrice: number
  profit: number
  profitPerHour: number
}

/**
 * Calculates profit for all potion crafts based on material costs and market prices.
 *
 * Formula:
 * - total_cost = SUM(mat_qty * mat_price) + vial_cost
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
 * @param potionCrafts - Array of potion crafts with materials and market prices
 * @param taxRate - Market tax rate (e.g., 0.12 for 12%)
 * @returns Array of potion profit results sorted by profit per hour descending
 */
export function calculatePotionProfits(
  potionCrafts: PotionCraft[],
  taxRate: number
): PotionProfitResult[] {
  const results: PotionProfitResult[] = potionCrafts.map(potion => {
    // Calculate material costs
    const materialResults: PotionMaterialResult[] = potion.materials.map(mat => ({
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

    // Total cost including vial
    const totalCost = totalMaterialCost + potion.vialCost

    // Minimum sell price to break even after tax
    // If we sell at minSellPrice, after tax we get: minSellPrice * (1 - taxRate)
    // We want: minSellPrice * (1 - taxRate) = totalCost
    // So: minSellPrice = totalCost / (1 - taxRate)
    const minSellPrice = totalCost / (1 - taxRate)

    // Current market price after tax
    const sellAfterTax = potion.currentPrice * (1 - taxRate)

    // Profit = what we get after tax - what we spent
    const profit = sellAfterTax - totalCost

    // Profit per hour
    const profitPerHour = profit / (potion.timeSeconds / 3600)

    return {
      name: potion.name,
      craftTimeSeconds: potion.timeSeconds,
      materials: materialResults,
      vialCost: potion.vialCost,
      totalCost,
      minSellPrice,
      currentPrice: potion.currentPrice,
      profit,
      profitPerHour
    }
  })

  // Sort by profit per hour descending
  return results.sort((a, b) => b.profitPerHour - a.profitPerHour)
}
