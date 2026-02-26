import { computed, type Ref } from 'vue'
import { useStorage } from './useStorage'
import type { RankedActivity } from '../calculators/profitRanker'

export interface ActivityFilters {
  dungeons: boolean
  potions: boolean
  resources: boolean
}

export interface UseActivityFiltersReturn {
  filterDungeons: Ref<boolean>
  filterPotions: Ref<boolean>
  filterResources: Ref<boolean>
  getFilteredActivities: (activities: RankedActivity[]) => RankedActivity[]
  getFilteredAndRerankedActivities: (activities: RankedActivity[]) => RankedActivity[]
}

/**
 * Composable for managing activity type filters.
 * Persists filter state to localStorage and provides filtering logic.
 */
export function useActivityFilters(): UseActivityFiltersReturn {
  // Persist filter state to localStorage
  const filters = useStorage<ActivityFilters>('active-filters', {
    dungeons: true,
    potions: true,
    resources: true,
  })

  // Individual filter refs for easy binding
  const filterDungeons = computed({
    get: () => filters.value.dungeons,
    set: (value: boolean) => {
      filters.value.dungeons = value
    },
  })

  const filterPotions = computed({
    get: () => filters.value.potions,
    set: (value: boolean) => {
      filters.value.potions = value
    },
  })

  const filterResources = computed({
    get: () => filters.value.resources,
    set: (value: boolean) => {
      filters.value.resources = value
    },
  })

  /**
   * Filter activities based on current filter state.
   * Preserves original rank numbers.
   */
  const getFilteredActivities = (activities: RankedActivity[]): RankedActivity[] => {
    return activities.filter((activity) => {
      if (activity.activityType === 'dungeon' && !filters.value.dungeons) return false
      if (activity.activityType === 'potion' && !filters.value.potions) return false
      if (activity.activityType === 'resource' && !filters.value.resources) return false
      return true
    })
  }

  /**
   * Filter activities and re-rank them starting from 1.
   * Updates the rank property to reflect filtered position.
   */
  const getFilteredAndRerankedActivities = (activities: RankedActivity[]): RankedActivity[] => {
    const filtered = getFilteredActivities(activities)

    // Re-rank filtered activities
    return filtered.map((activity, index) => ({
      ...activity,
      rank: index + 1,
    }))
  }

  return {
    filterDungeons,
    filterPotions,
    filterResources,
    getFilteredActivities,
    getFilteredAndRerankedActivities,
  }
}
