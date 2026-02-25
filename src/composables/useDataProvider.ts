/**
 * Data Provider Composable
 *
 * Unified data access layer with three-tier fallback:
 * 1. User manual overrides (localStorage) - highest priority
 * 2. API cached data - medium priority
 * 3. Default JSON data - lowest priority
 *
 * CRITICAL: Must work 100% without API key using default data
 */

import { ref, computed } from 'vue'
import type { DefaultData } from '../types'
import defaultData from '../data/defaults.json'

// Storage keys
const STORAGE_PREFIX = 'idlemmo-'
const USER_OVERRIDES_KEY = `${STORAGE_PREFIX}user-overrides`

/**
 * User overrides structure
 * Users can manually override any value in the default data
 */
interface UserOverrides {
  materials?: Record<string, { price?: number }>
  potions?: Record<string, { price?: number }>
  resources?: Record<string, { marketPrice?: number }>
  recipes?: Record<string, { price?: number; chance?: number; value?: number }>
}

/**
 * Get user overrides from localStorage
 */
function getUserOverrides(): UserOverrides {
  try {
    const stored = localStorage.getItem(USER_OVERRIDES_KEY)
    if (!stored) {
      return {}
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load user overrides:', error)
    return {}
  }
}

/**
 * Save user overrides to localStorage
 */
function saveUserOverrides(overrides: UserOverrides): void {
  try {
    localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(overrides))
  } catch (error) {
    console.error('Failed to save user overrides:', error)
  }
}

/**
 * Data provider composable
 *
 * Returns reactive data with three-tier fallback system
 */
export function useDataProvider() {
  // Load default data (cast to DefaultData type)
  const defaults = ref(defaultData as DefaultData)

  // Load user overrides
  const userOverrides = ref<UserOverrides>(getUserOverrides())

  /**
   * Apply user overrides to default data
   */
  function applyOverrides<T extends Record<string, unknown>>(
    defaultItems: T[],
    overrides: Record<string, Partial<T>> | undefined,
    idField: keyof T = 'id' as keyof T
  ): T[] {
    if (!overrides) {
      return defaultItems
    }

    return defaultItems.map((item) => {
      const id = item[idField] as string
      const override = overrides[id]

      if (!override) {
        return item
      }

      return { ...item, ...override }
    })
  }

  /**
   * Merged data with user overrides applied
   */
  const materials = computed(() => {
    return applyOverrides(
      defaults.value.materials,
      userOverrides.value.materials
    )
  })

  const potions = computed(() => {
    return applyOverrides(
      defaults.value.potions,
      userOverrides.value.potions
    )
  })

  const resources = computed(() => {
    return applyOverrides(
      defaults.value.resources,
      userOverrides.value.resources
    )
  })

  const recipes = computed(() => {
    return applyOverrides(
      defaults.value.recipes,
      userOverrides.value.recipes
    )
  })

  const dungeons = computed(() => defaults.value.dungeons)
  const potionCrafts = computed(() => defaults.value.potionCrafts)
  const resourceGathering = computed(() => defaults.value.resourceGathering)
  const magicFindDefaults = computed(() => defaults.value.magicFindDefaults)
  const marketTaxRate = computed(() => defaults.value.marketTaxRate)

  /**
   * Update a single material price
   */
  function updateMaterialPrice(id: string, price: number): void {
    const overrides = { ...userOverrides.value }

    if (!overrides.materials) {
      overrides.materials = {}
    }

    overrides.materials[id] = { price }
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Update a single potion price
   */
  function updatePotionPrice(id: string, price: number): void {
    const overrides = { ...userOverrides.value }

    if (!overrides.potions) {
      overrides.potions = {}
    }

    overrides.potions[id] = { price }
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Update a single resource market price
   */
  function updateResourcePrice(id: string, marketPrice: number): void {
    const overrides = { ...userOverrides.value }

    if (!overrides.resources) {
      overrides.resources = {}
    }

    overrides.resources[id] = { marketPrice }
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Update recipe data
   */
  function updateRecipe(
    id: string,
    data: { price?: number; chance?: number; value?: number }
  ): void {
    const overrides = { ...userOverrides.value }

    if (!overrides.recipes) {
      overrides.recipes = {}
    }

    overrides.recipes[id] = { ...overrides.recipes[id], ...data }
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Clear all user overrides for a specific category
   */
  function clearCategoryOverrides(
    category: 'materials' | 'potions' | 'resources' | 'recipes'
  ): void {
    const overrides = { ...userOverrides.value }
    delete overrides[category]
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Clear all user overrides
   */
  function clearAllOverrides(): void {
    userOverrides.value = {}
    saveUserOverrides({})
  }

  /**
   * Check if an item has user overrides
   */
  function hasOverride(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    id: string
  ): boolean {
    return !!(userOverrides.value[category]?.[id])
  }

  /**
   * Import data from API cache
   * This would be called when API data is fetched and cached
   * For now, it's a placeholder for future API integration
   */
  function importFromApiCache(): void {
    // TODO: Implement when API integration is ready
    // This will check the API cache and merge it with default data
    console.log('API cache import not yet implemented')
  }

  /**
   * Reload user overrides from localStorage
   * Useful if another tab modified the data
   */
  function reloadOverrides(): void {
    userOverrides.value = getUserOverrides()
  }

  /**
   * Get statistics about user overrides
   */
  function getOverrideStats() {
    const stats = {
      materials: Object.keys(userOverrides.value.materials || {}).length,
      potions: Object.keys(userOverrides.value.potions || {}).length,
      resources: Object.keys(userOverrides.value.resources || {}).length,
      recipes: Object.keys(userOverrides.value.recipes || {}).length,
    }

    const total = stats.materials + stats.potions + stats.resources + stats.recipes

    return { ...stats, total }
  }

  return {
    // Reactive data
    materials,
    potions,
    resources,
    recipes,
    dungeons,
    potionCrafts,
    resourceGathering,
    magicFindDefaults,
    marketTaxRate,

    // Update methods
    updateMaterialPrice,
    updatePotionPrice,
    updateResourcePrice,
    updateRecipe,

    // Clear methods
    clearCategoryOverrides,
    clearAllOverrides,

    // Utility methods
    hasOverride,
    importFromApiCache,
    reloadOverrides,
    getOverrideStats,
  }
}
