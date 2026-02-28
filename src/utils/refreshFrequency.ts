/**
 * Utility functions for computing suggested market refresh intervals
 *
 * Analyzes market history data to determine how frequently an item's price changes,
 * suggesting an appropriate refresh interval in minutes.
 */

import type { MarketHistoryResponse } from '../api/services'

/**
 * Compute suggested refresh interval in minutes based on market history data
 *
 * Algorithm:
 * 1. Analyze latest_sold for sub-day frequency (primary signal for active items)
 * 2. Analyze history_data for multi-day patterns (fallback/supplement)
 * 3. Combine signals (take minimum = more conservative)
 * 4. Clamp to 5-43200 minutes (5 min to 30 days)
 *
 * @param marketData - Market history response from API
 * @returns Suggested refresh interval in minutes, or null if insufficient data
 */
export function computeSuggestedRefreshMinutes(marketData: MarketHistoryResponse): number | null {
  let latestSoldMinutes: number | null = null
  let historyDataMinutes: number | null = null

  // Step 1: Analyze latest_sold for sub-day frequency
  if (marketData.latest_sold.length >= 2) {
    latestSoldMinutes = analyzeLatestSold(marketData.latest_sold)
  }

  // Step 2: Analyze history_data for multi-day patterns
  if (
    marketData.history_data.length >= 2 &&
    (marketData.latest_sold.length < 2 || (latestSoldMinutes && latestSoldMinutes < 60))
  ) {
    historyDataMinutes = analyzeHistoryData(marketData.history_data)
  }

  // Step 3: Combine signals
  let result: number | null = null
  if (latestSoldMinutes !== null && historyDataMinutes !== null) {
    // Take minimum (more conservative - refresh more often)
    result = Math.min(latestSoldMinutes, historyDataMinutes)
  } else if (latestSoldMinutes !== null) {
    result = latestSoldMinutes
  } else if (historyDataMinutes !== null) {
    result = historyDataMinutes
  }

  if (result === null) {
    return null
  }

  // Step 4: Clamp bounds (5 minutes to 30 days)
  const MIN_MINUTES = 5
  const MAX_MINUTES = 43200 // 30 days
  return Math.round(Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, result)))
}

/**
 * Analyze latest_sold entries for price change frequency
 */
function analyzeLatestSold(
  latestSold: Array<{ price_per_item: number; sold_at: string }>
): number | null {
  if (latestSold.length < 2) {
    return null
  }

  // Sort by sold_at ascending to get chronological order
  const sorted = [...latestSold].sort(
    (a, b) => new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime()
  )

  const firstTime = new Date(sorted[0].sold_at).getTime()
  const lastTime = new Date(sorted[sorted.length - 1].sold_at).getTime()
  const totalSpanMinutes = (lastTime - firstTime) / (1000 * 60)

  // If span is too short (< 1 second), data not representative
  if (totalSpanMinutes < 1 / 60) {
    return null
  }

  // Count meaningful price changes (>= 5% difference)
  let meaningfulChanges = 0
  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = sorted[i - 1].price_per_item
    const currPrice = sorted[i].price_per_item
    const priceDiff = Math.abs(currPrice - prevPrice)
    const percentChange = prevPrice > 0 ? priceDiff / prevPrice : 0

    if (percentChange >= 0.05) {
      meaningfulChanges++
    }
  }

  if (meaningfulChanges > 0) {
    // Refresh interval = time span / number of meaningful changes
    return totalSpanMinutes / meaningfulChanges
  } else {
    // No meaningful changes but high volume - stable price
    // Use transaction frequency as proxy, multiply by 2 (stable items need less frequent checks)
    const transactionFrequency = totalSpanMinutes / sorted.length
    return transactionFrequency * 2
  }
}

/**
 * Analyze history_data entries for price change frequency
 */
function analyzeHistoryData(
  historyData: Array<{ date: string; average_price: number; total_sold: number }>
): number | null {
  if (historyData.length < 2) {
    return null
  }

  // Sort by date ascending
  const sorted = [...historyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstDate = new Date(sorted[0].date).getTime()
  const lastDate = new Date(sorted[sorted.length - 1].date).getTime()
  const totalSpanDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24)

  if (totalSpanDays < 1) {
    return null
  }

  // Count meaningful price changes (> 5% difference)
  let meaningfulChanges = 0
  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = sorted[i - 1].average_price
    const currPrice = sorted[i].average_price
    const priceDiff = Math.abs(currPrice - prevPrice)
    const percentChange = prevPrice > 0 ? priceDiff / prevPrice : 0

    if (percentChange >= 0.05) {
      meaningfulChanges++
    }
  }

  if (meaningfulChanges > 0) {
    // Refresh interval in minutes = (total span in days / changes) * 24 * 60
    return (totalSpanDays / meaningfulChanges) * 24 * 60
  } else {
    // No meaningful changes - stable price over multiple days
    // Use entry frequency as proxy, multiply by 2
    const entryFrequency = totalSpanDays / sorted.length
    return entryFrequency * 24 * 60 * 2
  }
}

/**
 * Format refresh interval in minutes to human-readable string
 *
 * @param minutes - Refresh interval in minutes
 * @returns Human-readable string (e.g., "every 15 min", "every 2.5h", "every 3.5d")
 */
export function formatRefreshInterval(minutes: number): string {
  if (minutes < 60) {
    // Less than 1 hour - show as minutes
    return `every ${Math.round(minutes)} min`
  } else if (minutes < 24 * 60) {
    // Less than 1 day - show as hours
    const hours = minutes / 60
    return `every ${hours.toFixed(1)}h`
  } else {
    // 1 day or more - show as days
    const days = minutes / (24 * 60)
    return `every ${days.toFixed(1)}d`
  }
}
