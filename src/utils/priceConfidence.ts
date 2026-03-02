/**
 * Utility functions for detecting low-confidence prices
 *
 * A price is considered "low-confidence" if the item hasn't been sold recently.
 * This helps users identify items where the market price may be stale or unreliable.
 */

import type { LatestSoldEntry } from '../api/services'

/** Number of days without sales to consider a price low-confidence */
const LOW_CONFIDENCE_THRESHOLD_DAYS = 30

/** Number of milliseconds in a day */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Check if a price is low-confidence based on sales history.
 *
 * A price is low-confidence if:
 * - There are no sales at all (empty latest_sold array), OR
 * - The most recent sale is older than 30 days
 *
 * @param latestSold - Array of recent sales from market history
 * @returns true if the price is considered low-confidence
 */
export function isLowConfidencePrice(latestSold: LatestSoldEntry[]): boolean {
  // No sales data at all - definitely low confidence
  if (latestSold.length === 0) {
    return true
  }

  // Find the most recent sale
  const mostRecentSale = latestSold.reduce((mostRecent, current) => {
    const currentTime = new Date(current.sold_at).getTime()
    const mostRecentTime = new Date(mostRecent.sold_at).getTime()
    return currentTime > mostRecentTime ? current : mostRecent
  })

  // Check if the most recent sale is older than threshold
  const mostRecentTime = new Date(mostRecentSale.sold_at).getTime()
  const now = Date.now()
  const daysSinceLastSale = (now - mostRecentTime) / MS_PER_DAY

  return daysSinceLastSale > LOW_CONFIDENCE_THRESHOLD_DAYS
}

/**
 * Check if a price is low-confidence based on sales history with a custom reference date.
 * Useful for testing or for consistent behavior in server-side rendering.
 *
 * @param latestSold - Array of recent sales from market history
 * @param referenceDate - The date to compare against (defaults to now)
 * @returns true if the price is considered low-confidence
 */
export function isLowConfidencePriceWithDate(
  latestSold: LatestSoldEntry[],
  referenceDate: Date
): boolean {
  // No sales data at all - definitely low confidence
  if (latestSold.length === 0) {
    return true
  }

  // Find the most recent sale
  const mostRecentSale = latestSold.reduce((mostRecent, current) => {
    const currentTime = new Date(current.sold_at).getTime()
    const mostRecentTime = new Date(mostRecent.sold_at).getTime()
    return currentTime > mostRecentTime ? current : mostRecent
  })

  // Check if the most recent sale is older than threshold
  const mostRecentTime = new Date(mostRecentSale.sold_at).getTime()
  const referenceTime = referenceDate.getTime()
  const daysSinceLastSale = (referenceTime - mostRecentTime) / MS_PER_DAY

  return daysSinceLastSale > LOW_CONFIDENCE_THRESHOLD_DAYS
}

/**
 * Get a human-readable reason for why a price is low-confidence.
 * Returns null if the price is not low-confidence.
 *
 * @param latestSold - Array of recent sales from market history
 * @returns Description of why the price is low-confidence, or null if it's not
 */
export function getLowConfidenceReason(latestSold: LatestSoldEntry[]): string | null {
  if (latestSold.length === 0) {
    return 'No sales history available'
  }

  const mostRecentSale = latestSold.reduce((mostRecent, current) => {
    const currentTime = new Date(current.sold_at).getTime()
    const mostRecentTime = new Date(mostRecent.sold_at).getTime()
    return currentTime > mostRecentTime ? current : mostRecent
  })

  const mostRecentTime = new Date(mostRecentSale.sold_at).getTime()
  const now = Date.now()
  const daysSinceLastSale = (now - mostRecentTime) / MS_PER_DAY

  if (daysSinceLastSale > LOW_CONFIDENCE_THRESHOLD_DAYS) {
    const daysAgo = Math.round(daysSinceLastSale)
    return `Last sale was ${daysAgo} days ago (threshold: ${LOW_CONFIDENCE_THRESHOLD_DAYS} days)`
  }

  return null
}
