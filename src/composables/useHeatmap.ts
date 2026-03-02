/**
 * Composable for heatmap coloring based on profit values.
 *
 * Provides functions to calculate heatmap colors for profit cells in tables.
 * - Deep green for high profit
 * - Light green for moderate profit
 * - Yellow for low/break-even profit
 * - Red for negative profit
 */

export interface HeatmapStyle extends Record<string, string> {
  backgroundColor: string
  color: string
}

/**
 * Calculate heatmap color for a profit value.
 *
 * @param profit - The profit value
 * @param minProfit - The minimum profit in the dataset
 * @param maxProfit - The maximum profit in the dataset
 * @returns Style object with backgroundColor and text color
 */
export function getHeatmapStyle(
  profit: number,
  minProfit: number,
  maxProfit: number
): HeatmapStyle {
  // Handle negative profits - use red gradient
  if (profit < 0) {
    const minNegative = Math.min(minProfit, 0)
    const normalized = minNegative === 0 ? 1 : Math.abs(profit / minNegative)
    const intensity = Math.min(normalized, 1)

    // Red gradient: lighter to darker red — capped at 0.12 alpha for contrast
    const r = 239
    const g = Math.round(68 - 20 * intensity)
    const b = Math.round(68 - 20 * intensity)
    const alpha = 0.05 + intensity * 0.07

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      color: '#fca5a5', // Lighter red for WCAG AA contrast on dark backgrounds
    }
  }

  // Handle zero or near-zero positive profits - use yellow
  if (profit <= 0 || profit < maxProfit * 0.02) {
    return {
      backgroundColor: 'rgba(234, 179, 8, 0.1)',
      color: '#eab308', // Yellow text
    }
  }

  // Handle positive profits - use continuous green gradient
  // Power scale (exponent 0.3) spreads values much better than linear or log
  // when max >> min (e.g., 17M max vs 440K min: linear=0.026, log=0.78, pow0.3=0.30)
  const linear = maxProfit === 0 ? 1 : profit / maxProfit
  const normalized = Math.pow(Math.max(linear, 0), 0.3)

  // Proportional alpha: from 0.04 (lowest profitable) to 0.18 (highest profit)
  // This creates clear visual distinction between high and low profit items
  // Pure emerald green (16, 185, 129) ensures no color shift — only intensity varies
  const alpha = 0.04 + normalized * 0.14
  const textColor = normalized > 0.5 ? '#10b981' : '#14b8a6'

  return {
    backgroundColor: `rgba(16, 185, 129, ${alpha.toFixed(3)})`,
    color: textColor,
  }
}

/**
 * Calculate heatmap class based on profit value.
 *
 * @param profit - The profit value
 * @param minProfit - The minimum profit in the dataset
 * @param maxProfit - The maximum profit in the dataset
 * @returns CSS class name for heatmap styling
 */
export function getHeatmapClass(profit: number, minProfit: number, maxProfit: number): string {
  if (profit < 0) {
    return 'heatmap-negative'
  }

  if (profit < maxProfit * 0.1) {
    return 'heatmap-low'
  }

  const range = maxProfit - minProfit
  const normalized = range === 0 ? 1 : (profit - minProfit) / range

  if (normalized < 0.33) {
    return 'heatmap-medium-low'
  } else if (normalized < 0.66) {
    return 'heatmap-medium-high'
  } else {
    return 'heatmap-high'
  }
}

/**
 * Use heatmap functionality in a component.
 *
 * @returns Object with heatmap utility functions
 */
/**
 * Get a subdued heatmap style (1/3 intensity) for secondary profit columns.
 * Creates a 3:1 visual ratio with the primary profit/hr column.
 */
export function getSubduedHeatmapStyle(
  profit: number,
  minProfit: number,
  maxProfit: number
): HeatmapStyle {
  const style = getHeatmapStyle(profit, minProfit, maxProfit)
  // Use 1/3 the background alpha for secondary columns (3:1 ratio with primary)
  const match = style.backgroundColor.match(/rgba?\(([^)]+)\)/)
  if (match) {
    const parts = match[1].split(',').map((s) => s.trim())
    if (parts.length === 4) {
      const alpha = parseFloat(parts[3]) * 0.33
      style.backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha.toFixed(3)})`
    }
  }
  return style
}

/**
 * Get a logarithmic spread style for Market tab spread column.
 * Uses log10 scale to handle the extreme dynamic range (24% to 13789%).
 */
export function getSpreadStyle(spreadPercent: number, maxSpread: number): HeatmapStyle {
  if (spreadPercent <= 0) {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      color: '#f87171',
    }
  }

  // Logarithmic scale for wide dynamic range
  const logMax = Math.log10(Math.max(maxSpread, 1))
  const logVal = Math.log10(Math.max(spreadPercent, 1))
  const normalized = logMax === 0 ? 0.5 : logVal / logMax

  // Alpha range: 0.02 (low spread) to 0.14 (high spread)
  const alpha = 0.02 + normalized * 0.12
  const textColor = normalized > 0.6 ? '#10b981' : '#34d399'

  return {
    backgroundColor: `rgba(16, 185, 129, ${alpha.toFixed(3)})`,
    color: textColor,
  }
}

export function useHeatmap() {
  return {
    getHeatmapStyle,
    getHeatmapClass,
    getSubduedHeatmapStyle,
    getSpreadStyle,
  }
}
