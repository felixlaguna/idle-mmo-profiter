/**
 * Composable for managing low-confidence price filter toggles.
 *
 * Provides two independent toggles for:
 * - Crafting page: show/hide craftables with low-confidence prices
 * - Dungeons page: show/hide dungeons with low-confidence drops
 *
 * Both toggles default to false (exclude low-confidence items).
 * State persists to localStorage.
 *
 * NOTE: This is a TRUE SINGLETON - all calls share the same reactive state.
 */

import { computed, type Ref } from 'vue'
import { useStorage } from './useStorage'

export interface LowConfidenceFilterState {
  showLowConfidenceCraftables: boolean
  showLowConfidenceDungeons: boolean
}

export interface UseLowConfidenceFilterReturn {
  /** Whether to show low-confidence craftables (reactive) */
  showLowConfidenceCraftables: Ref<boolean>
  /** Whether to show low-confidence dungeons (reactive) */
  showLowConfidenceDungeons: Ref<boolean>
  /** Set the craftables filter value */
  setShowLowConfidenceCraftables: (value: boolean) => void
  /** Set the dungeons filter value */
  setShowLowConfidenceDungeons: (value: boolean) => void
  /** Filter craftables array based on low-confidence status */
  filterCraftables: <T extends { isLowConfidence?: boolean }>(items: T[]) => T[]
  /** Filter dungeons array based on low-confidence status */
  filterDungeons: <T extends { isLowConfidence?: boolean }>(items: T[]) => T[]
}

// Module-level singleton: Create filter state once at module load time
// This ensures all components share the SAME reactive refs
const filterState = useStorage<LowConfidenceFilterState>('low-confidence-filter', {
  showLowConfidenceCraftables: false,
  showLowConfidenceDungeons: false,
})

/**
 * Composable for managing low-confidence price filter toggles.
 *
 * @returns Object containing reactive filter states and setter functions
 */
export function useLowConfidenceFilter(): UseLowConfidenceFilterReturn {
  // Individual filter refs for easy binding
  const showLowConfidenceCraftables = computed({
    get: () => filterState.value.showLowConfidenceCraftables,
    set: (value: boolean) => {
      filterState.value.showLowConfidenceCraftables = value
    },
  })

  const showLowConfidenceDungeons = computed({
    get: () => filterState.value.showLowConfidenceDungeons,
    set: (value: boolean) => {
      filterState.value.showLowConfidenceDungeons = value
    },
  })

  // Setter functions
  const setShowLowConfidenceCraftables = (value: boolean) => {
    filterState.value.showLowConfidenceCraftables = value
  }

  const setShowLowConfidenceDungeons = (value: boolean) => {
    filterState.value.showLowConfidenceDungeons = value
  }

  /**
   * Filter craftables based on low-confidence status.
   * If toggle is off (default), excludes low-confidence items.
   */
  const filterCraftables = <T extends { isLowConfidence?: boolean }>(items: T[]): T[] => {
    if (filterState.value.showLowConfidenceCraftables) {
      return items
    }
    return items.filter((item) => !item.isLowConfidence)
  }

  /**
   * Filter dungeons based on low-confidence status.
   * If toggle is off (default), excludes low-confidence items.
   */
  const filterDungeons = <T extends { isLowConfidence?: boolean }>(items: T[]): T[] => {
    if (filterState.value.showLowConfidenceDungeons) {
      return items
    }
    return items.filter((item) => !item.isLowConfidence)
  }

  return {
    showLowConfidenceCraftables,
    showLowConfidenceDungeons,
    setShowLowConfidenceCraftables,
    setShowLowConfidenceDungeons,
    filterCraftables,
    filterDungeons,
  }
}
