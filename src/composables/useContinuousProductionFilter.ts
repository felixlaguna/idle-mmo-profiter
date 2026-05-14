/**
 * Composable for the "Can handle continuous production" filter.
 *
 * When enabled, activities are only shown if the market can absorb continuous
 * 24/7 production. Weekly production capacity is calculated from the craft time:
 *
 *   weeklyProduction = (7 * 24 * 3600) / timePerAction
 *
 * An activity passes if weeklySalesVolume >= weeklyProduction.
 * Activities without market data (resources) always pass through.
 *
 * State persists to localStorage as a simple boolean toggle.
 *
 * NOTE: This is a TRUE SINGLETON - all calls share the same reactive state.
 */

import { computed, type Ref } from 'vue'
import { useStorage } from './useStorage'

export interface ContinuousProductionFilterState {
  enabled: boolean
}

export interface UseContinuousProductionFilterReturn {
  /** Whether the filter is enabled (reactive boolean) */
  continuousProductionEnabled: Ref<boolean>
  /** Set filter enabled state */
  setContinuousProductionEnabled: (value: boolean) => void
  /**
   * Check if an activity can handle continuous production.
   * Returns true if the market can absorb 24/7 production of this item.
   */
  canHandleContinuousProduction: (activity: {
    weeklySalesVolume?: number
    timePerAction: number
  }) => boolean
  /**
   * Filter activities array: only keep those the market can absorb 24/7.
   * Activities with undefined weeklySalesVolume (resources) always pass.
   */
  filterByContinuousProduction: <T extends { weeklySalesVolume?: number; timePerAction: number }>(
    items: T[]
  ) => T[]
}

/** Seconds in one week (7 * 24 * 3600) */
const SECONDS_PER_WEEK = 604_800

// Module-level singleton: Create filter state once at module load time
const filterState = useStorage<ContinuousProductionFilterState>('continuous-production-filter', {
  enabled: false,
})

/**
 * Composable for the continuous production filter.
 *
 * @returns Object containing reactive toggle and filter function
 */
export function useContinuousProductionFilter(): UseContinuousProductionFilterReturn {
  const continuousProductionEnabled = computed({
    get: () => filterState.value.enabled,
    set: (value: boolean) => {
      filterState.value.enabled = value
    },
  })

  const setContinuousProductionEnabled = (value: boolean) => {
    filterState.value.enabled = value
  }

  /**
   * Check if an activity can handle continuous 24/7 production.
   * Items without market data (resources) always pass.
   */
  const canHandleContinuousProduction = (activity: {
    weeklySalesVolume?: number
    timePerAction: number
  }): boolean => {
    if (activity.weeklySalesVolume === undefined) return true
    const weeklyProduction = SECONDS_PER_WEEK / activity.timePerAction
    return activity.weeklySalesVolume >= weeklyProduction
  }

  /**
   * Filter activities based on continuous production capacity.
   * When the toggle is OFF, all items pass through (no filtering).
   * When ON, only items whose market can absorb 24/7 production are kept.
   */
  const filterByContinuousProduction = <
    T extends { weeklySalesVolume?: number; timePerAction: number },
  >(
    items: T[]
  ): T[] => {
    if (!filterState.value.enabled) return items
    return items.filter((item) => canHandleContinuousProduction(item))
  }

  return {
    continuousProductionEnabled,
    setContinuousProductionEnabled,
    canHandleContinuousProduction,
    filterByContinuousProduction,
  }
}
