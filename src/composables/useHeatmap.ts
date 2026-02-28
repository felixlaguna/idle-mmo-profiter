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

    // Red gradient: lighter to darker red
    const r = 239
    const g = Math.round(68 - 20 * intensity)
    const b = Math.round(68 - 20 * intensity)
    const alpha = 0.15 + intensity * 0.25

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      color: '#ef4444', // Red text
    }
  }

  // Handle zero or very small positive profits - use yellow
  if (profit < maxProfit * 0.1) {
    return {
      backgroundColor: 'rgba(234, 179, 8, 0.1)',
      color: '#eab308', // Yellow text
    }
  }

  // Handle positive profits - use green gradient
  const range = maxProfit - minProfit
  const normalized = range === 0 ? 1 : (profit - minProfit) / range

  // Green gradient: light to dark green
  if (normalized < 0.33) {
    // Light green
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
    }
  } else if (normalized < 0.66) {
    // Medium green
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      color: '#10b981',
    }
  } else {
    // Deep green
    return {
      backgroundColor: 'rgba(16, 185, 129, 0.3)',
      color: '#059669',
    }
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
export function useHeatmap() {
  return {
    getHeatmapStyle,
    getHeatmapClass,
  }
}
