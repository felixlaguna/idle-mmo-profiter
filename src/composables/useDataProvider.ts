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
import type { DefaultData, Recipe } from '../types'
import defaultData from '../data/defaults.json'

// Storage keys
const STORAGE_PREFIX = 'idlemmo:'
const USER_OVERRIDES_KEY = `${STORAGE_PREFIX}user-overrides`
const POTION_CRAFTS_KEY = `${STORAGE_PREFIX}potion-crafts`

/**
 * User overrides structure
 * Users can manually override any value in the default data
 */
interface UserOverrides {
  materials?: Record<
    string,
    { price?: number; refreshExcluded?: boolean; hashedId?: string; vendorValue?: number }
  >
  potions?: Record<
    string,
    { price?: number; refreshExcluded?: boolean; hashedId?: string; vendorValue?: number }
  >
  resources?: Record<
    string,
    { marketPrice?: number; refreshExcluded?: boolean; hashedId?: string; vendorValue?: number }
  >
  recipes?: Record<
    string,
    {
      price?: number
      chance?: number
      value?: number
      refreshExcluded?: boolean
      hashedId?: string
      vendorValue?: number
      uses?: number
      producesItemName?: string
      producesItemHashedId?: string
      isUntradable?: boolean
      tradableCounterpartId?: string
    }
  >
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
 * Save potionCrafts to localStorage
 */
function savePotionCrafts(potionCrafts: DefaultData['potionCrafts']): void {
  try {
    localStorage.setItem(POTION_CRAFTS_KEY, JSON.stringify(potionCrafts))
  } catch (error) {
    console.error('Failed to save potion crafts:', error)
  }
}

/**
 * Load potionCrafts from localStorage, merging with defaults
 */
function loadPotionCrafts(defaultCrafts: DefaultData['potionCrafts']): DefaultData['potionCrafts'] {
  try {
    const stored = localStorage.getItem(POTION_CRAFTS_KEY)
    if (!stored) return defaultCrafts

    const savedCrafts = JSON.parse(stored) as DefaultData['potionCrafts']
    // Use saved crafts as the source of truth (includes additions, removals, time edits)
    return savedCrafts
  } catch (error) {
    console.error('Failed to load potion crafts:', error)
    return defaultCrafts
  }
}

// Singleton instance - created once and shared across all calls
let dataProviderInstance: ReturnType<typeof createDataProvider> | null = null

/**
 * Create data provider instance
 * This is called once and the result is cached
 */
function createDataProvider() {
  // One-time migration: Move data from old prefix to new prefix
  // Old key: 'idlemmo-user-overrides'
  // New key: 'idlemmo:user-overrides'
  const oldKey = 'idlemmo-user-overrides'
  const newKey = 'idlemmo:user-overrides'

  try {
    const oldData = localStorage.getItem(oldKey)
    const newData = localStorage.getItem(newKey)

    // Only migrate if old key exists and new key does NOT exist
    if (oldData && !newData) {
      localStorage.setItem(newKey, oldData)
      localStorage.removeItem(oldKey)
      console.log('Migrated user overrides from old storage key to new storage key')
    }
  } catch (error) {
    console.error('Failed to migrate user overrides:', error)
  }

  // Load default data (cast to DefaultData type)
  const loadedDefaults = defaultData as DefaultData
  // Restore persisted potionCrafts (includes user additions/removals/edits)
  loadedDefaults.potionCrafts = loadPotionCrafts(loadedDefaults.potionCrafts)
  const defaults = ref(loadedDefaults)

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
    return applyOverrides(defaults.value.materials, userOverrides.value.materials)
  })

  const potions = computed(() => {
    return applyOverrides(defaults.value.potions, userOverrides.value.potions)
  })

  const resources = computed(() => {
    return applyOverrides(defaults.value.resources, userOverrides.value.resources)
  })

  const recipes = computed(() => {
    return applyOverrides(defaults.value.recipes, userOverrides.value.recipes)
  })

  const dungeons = computed(() => defaults.value.dungeons)
  const magicFindDefaults = computed(() => defaults.value.magicFindDefaults)
  const marketTaxRate = computed(() => defaults.value.marketTaxRate)

  /**
   * Create lookup maps for material, potion, and resource prices
   * These allow us to apply overrides to activity data
   */
  const materialPriceMap = computed(() => {
    const map = new Map<string, number>()
    materials.value.forEach((mat) => {
      map.set(mat.name, mat.price)
    })
    return map
  })

  const potionPriceMap = computed(() => {
    const map = new Map<string, number>()
    potions.value.forEach((pot) => {
      map.set(pot.name, pot.price)
    })
    return map
  })

  const resourcePriceMap = computed(() => {
    const map = new Map<string, number>()
    resources.value.forEach((res) => {
      map.set(res.name, res.marketPrice)
    })
    return map
  })

  /**
   * PotionCrafts with material prices and potion prices updated from overrides
   * This ensures that when a user edits a material price in the Market tab,
   * it flows through to the potion craft calculations
   */
  const potionCrafts = computed(() => {
    return defaults.value.potionCrafts.map((craft) => {
      // Update material unit costs from material price overrides
      const updatedMaterials = craft.materials.map((mat) => ({
        ...mat,
        unitCost: materialPriceMap.value.get(mat.name) ?? mat.unitCost,
      }))

      // Update current price from potion price overrides
      const updatedPrice = potionPriceMap.value.get(craft.name) ?? craft.currentPrice

      return {
        ...craft,
        materials: updatedMaterials,
        currentPrice: updatedPrice,
      }
    })
  })

  /**
   * ResourceGathering with market prices and costs updated from overrides
   * This ensures that when a user edits a resource price in the Market tab,
   * it flows through to the resource gathering calculations.
   *
   * Cost is computed as: baseCost + sum of input costs
   * where input cost = quantity * (useMarketPrice ? marketPrice : baseCost)
   */
  const resourceGathering = computed(() => {
    // First pass: create a map to store all resources
    const resourceMap = new Map<string, (typeof defaults.value.resourceGathering)[0]>()
    defaults.value.resourceGathering.forEach((gather) => {
      resourceMap.set(gather.name, gather)
    })

    // Second pass: compute costs with resolved dependencies
    return defaults.value.resourceGathering.map((gather) => {
      // Update market price from resource price overrides
      const updatedPrice = resourcePriceMap.value.get(gather.name) ?? gather.marketPrice

      // Compute cost dynamically from inputs
      let computedCost = gather.baseCost

      if (gather.inputs && gather.inputs.length > 0) {
        for (const input of gather.inputs) {
          const inputResource = resourceMap.get(input.resourceName)

          if (!inputResource) {
            console.warn(`Resource input not found: ${input.resourceName}`)
            continue
          }

          // Get the input price (either market price or base cost)
          let inputPrice: number
          if (input.useMarketPrice) {
            // Use market price from overrides or default
            inputPrice = resourcePriceMap.value.get(input.resourceName) ?? inputResource.marketPrice
          } else {
            // Use base cost (for nested resources)
            inputPrice = inputResource.baseCost
          }

          computedCost += input.quantity * inputPrice
        }
      }

      return {
        ...gather,
        marketPrice: updatedPrice,
        cost: computedCost,
      }
    })
  })

  /**
   * Update a single material price
   */
  function updateMaterialPrice(id: string, price: number): void {
    const overrides = { ...userOverrides.value }

    if (!overrides.materials) {
      overrides.materials = {}
    }

    overrides.materials[id] = { ...overrides.materials[id], price }
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

    overrides.potions[id] = { ...overrides.potions[id], price }
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

    overrides.resources[id] = { ...overrides.resources[id], marketPrice }
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
   * Update hashedId for an item — persisted to localStorage via user overrides
   */
  function updateHashedId(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    id: string,
    hashedId: string
  ): void {
    // Update in-memory defaults
    const item = defaults.value[category].find((item: { id: string }) => item.id === id)
    if (item) {
      ;(item as { hashedId?: string }).hashedId = hashedId
    }
    // Persist to localStorage via user overrides
    const overrides = { ...userOverrides.value }
    if (!overrides[category]) {
      overrides[category] = {} as Record<string, never>
    }
    const categoryOverrides = overrides[category]!
    categoryOverrides[id] = { ...categoryOverrides[id], hashedId }
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Update vendorValue for an item — persisted to localStorage via user overrides
   */
  function updateVendorValue(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    id: string,
    vendorValue: number
  ): void {
    const overrides = { ...userOverrides.value }
    if (!overrides[category]) {
      overrides[category] = {} as Record<string, never>
    }
    const categoryOverrides = overrides[category]!
    categoryOverrides[id] = { ...categoryOverrides[id], vendorValue }
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Check if an item has user overrides
   */
  function hasOverride(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    id: string
  ): boolean {
    return !!userOverrides.value[category]?.[id]
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

  /**
   * Set refresh exclusion state for a single item
   */
  function setRefreshExcluded(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    id: string,
    excluded: boolean
  ): void {
    const overrides = { ...userOverrides.value }

    if (!overrides[category]) {
      overrides[category] = {}
    }

    if (!overrides[category]![id]) {
      overrides[category]![id] = {}
    }

    overrides[category]![id].refreshExcluded = excluded
    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Check if an item is excluded from refresh
   */
  function isRefreshExcluded(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    id: string
  ): boolean {
    return userOverrides.value[category]?.[id]?.refreshExcluded ?? false
  }

  /**
   * Bulk set refresh exclusion for all items in a category
   */
  function setAllRefreshExcluded(
    category: 'materials' | 'potions' | 'resources' | 'recipes',
    excluded: boolean
  ): void {
    const overrides = { ...userOverrides.value }

    if (!overrides[category]) {
      overrides[category] = {}
    }

    // Get all items from the category
    let itemIds: string[] = []
    switch (category) {
      case 'materials':
        itemIds = defaults.value.materials.map((item) => item.id)
        break
      case 'potions':
        itemIds = defaults.value.potions.map((item) => item.id)
        break
      case 'resources':
        itemIds = defaults.value.resources.map((item) => item.id)
        break
      case 'recipes':
        itemIds = defaults.value.recipes.map((item) => item.id)
        break
    }

    // Set exclusion state for all items
    itemIds.forEach((id) => {
      if (!overrides[category]![id]) {
        overrides[category]![id] = {}
      }
      overrides[category]![id].refreshExcluded = excluded
    })

    userOverrides.value = overrides
    saveUserOverrides(overrides)
  }

  /**
   * Get exclusion statistics for a specific category or all categories
   */
  function getExclusionStats(category?: 'materials' | 'potions' | 'resources' | 'recipes') {
    if (category) {
      // Stats for a specific category
      let totalItems = 0
      switch (category) {
        case 'materials':
          totalItems = defaults.value.materials.length
          break
        case 'potions':
          totalItems = defaults.value.potions.length
          break
        case 'resources':
          totalItems = defaults.value.resources.length
          break
        case 'recipes':
          totalItems = defaults.value.recipes.length
          break
      }

      const excluded = Object.values(userOverrides.value[category] || {}).filter(
        (override) => override.refreshExcluded === true
      ).length

      return {
        total: totalItems,
        excluded,
        included: totalItems - excluded,
      }
    }

    // Stats for all categories
    const materialsTotal = defaults.value.materials.length
    const potionsTotal = defaults.value.potions.length
    const resourcesTotal = defaults.value.resources.length
    const recipesTotal = defaults.value.recipes.length

    const materialsExcluded = Object.values(userOverrides.value.materials || {}).filter(
      (override) => override.refreshExcluded === true
    ).length

    const potionsExcluded = Object.values(userOverrides.value.potions || {}).filter(
      (override) => override.refreshExcluded === true
    ).length

    const resourcesExcluded = Object.values(userOverrides.value.resources || {}).filter(
      (override) => override.refreshExcluded === true
    ).length

    const recipesExcluded = Object.values(userOverrides.value.recipes || {}).filter(
      (override) => override.refreshExcluded === true
    ).length

    const totalItems = materialsTotal + potionsTotal + resourcesTotal + recipesTotal
    const totalExcluded = materialsExcluded + potionsExcluded + resourcesExcluded + recipesExcluded

    return {
      materials: {
        total: materialsTotal,
        excluded: materialsExcluded,
        included: materialsTotal - materialsExcluded,
      },
      potions: {
        total: potionsTotal,
        excluded: potionsExcluded,
        included: potionsTotal - potionsExcluded,
      },
      resources: {
        total: resourcesTotal,
        excluded: resourcesExcluded,
        included: resourcesTotal - resourcesExcluded,
      },
      recipes: {
        total: recipesTotal,
        excluded: recipesExcluded,
        included: recipesTotal - recipesExcluded,
      },
      total: totalItems,
      totalExcluded,
      totalIncluded: totalItems - totalExcluded,
    }
  }

  /**
   * Add a new PotionCraft entry to the defaults
   */
  function addPotionCraft(potionCraft: {
    name: string
    timeSeconds: number
    materials: Array<{ name: string; quantity: number; unitCost: number }>
    currentPrice: number
    skill?: 'alchemy' | 'forging'
  }): void {
    defaults.value.potionCrafts.push(potionCraft)
    defaults.value = { ...defaults.value }
    savePotionCrafts(defaults.value.potionCrafts)
  }

  /**
   * Add a new Material entry to the defaults (if it doesn't already exist)
   */
  function addMaterial(material: { name: string; price: number; hashedId?: string; vendorValue?: number }): string {
    const existing = materials.value.find((m) => m.name === material.name)
    if (existing) return existing.id

    const id = `mat-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    defaults.value.materials.push({
      id,
      name: material.name,
      price: material.price,
      hashedId: material.hashedId || '',
      vendorValue: material.vendorValue || 0,
    })
    defaults.value = { ...defaults.value }
    return id
  }

  /**
   * Add a new Potion entry to the defaults (if it doesn't already exist)
   */
  function addPotion(potion: { name: string; price: number; hashedId?: string; vendorValue?: number }): string {
    const existing = potions.value.find((p) => p.name === potion.name)
    if (existing) return existing.id

    const id = `pot-auto-${Date.now()}`
    defaults.value.potions.push({
      id,
      name: potion.name,
      price: potion.price,
      hashedId: potion.hashedId || '',
      vendorValue: potion.vendorValue || 0,
    })
    defaults.value = { ...defaults.value }
    return id
  }

  /**
   * Update a PotionCraft's craft time by potion name
   */
  function updatePotionCraftTime(potionName: string, timeSeconds: number): void {
    const craft = defaults.value.potionCrafts.find((c) => c.name === potionName)
    if (craft) {
      craft.timeSeconds = timeSeconds
      defaults.value = { ...defaults.value }
      savePotionCrafts(defaults.value.potionCrafts)
    }
  }

  /**
   * Remove a PotionCraft entry by name
   */
  function removePotionCraft(name: string): void {
    defaults.value.potionCrafts = defaults.value.potionCrafts.filter(
      (craft) => craft.name !== name
    )
    defaults.value = { ...defaults.value }
    savePotionCrafts(defaults.value.potionCrafts)
  }

  /**
   * Update a recipe's structural fields in defaults (uses, producesItemName, etc.)
   * Persisted to localStorage via user overrides so they survive refresh.
   */
  function updateRecipeDefaults(id: string, data: Partial<Recipe>): void {
    const recipe = defaults.value.recipes.find((r) => r.id === id)
    if (recipe) {
      Object.assign(recipe, data)
      defaults.value = { ...defaults.value }

      // Persist structural fields to user overrides
      const overrides = { ...userOverrides.value }
      if (!overrides.recipes) {
        overrides.recipes = {}
      }
      overrides.recipes[id] = { ...overrides.recipes[id], ...data }
      userOverrides.value = overrides
      saveUserOverrides(overrides)
    }
  }

  /**
   * Export current data as a defaults.json compatible JSON string
   *
   * This creates a complete DefaultData object with all user overrides merged in,
   * producing a drop-in replacement for src/data/defaults.json
   */
  function exportAsDefaultsJson(): string {
    // Build the complete data object with user overrides applied
    // Use computed arrays which already have overrides merged
    const exportData: DefaultData = {
      materials: materials.value.map(mat => ({
        id: mat.id,
        name: mat.name,
        price: mat.price,
        hashedId: mat.hashedId || '',
        vendorValue: mat.vendorValue || 0,
      })),
      potions: potions.value.map(pot => ({
        id: pot.id,
        name: pot.name,
        price: pot.price,
        hashedId: pot.hashedId || '',
        vendorValue: pot.vendorValue || 0,
      })),
      resources: resources.value.map(res => ({
        id: res.id,
        name: res.name,
        marketPrice: res.marketPrice,
        vendorValue: res.vendorValue,
        hashedId: res.hashedId || '',
      })),
      recipes: recipes.value.map(recipe => {
        const exported: Recipe = {
          id: recipe.id,
          name: recipe.name,
          price: recipe.price,
          chance: recipe.chance,
          hashedId: recipe.hashedId || '',
          vendorValue: recipe.vendorValue || 0,
        }
        if (recipe.value !== undefined) exported.value = recipe.value
        if (recipe.uses !== undefined) exported.uses = recipe.uses
        if (recipe.producesItemName) exported.producesItemName = recipe.producesItemName
        if (recipe.producesItemHashedId) exported.producesItemHashedId = recipe.producesItemHashedId
        if (recipe.isUntradable !== undefined) exported.isUntradable = recipe.isUntradable
        if (recipe.tradableCounterpartId) exported.tradableCounterpartId = recipe.tradableCounterpartId
        return exported
      }),
      dungeons: dungeons.value,
      potionCrafts: potionCrafts.value.map(craft => ({
        name: craft.name,
        skill: craft.skill,
        timeSeconds: craft.timeSeconds,
        materials: craft.materials.map(mat => ({
          name: mat.name,
          quantity: mat.quantity,
          unitCost: mat.unitCost,
        })),
        currentPrice: craft.currentPrice,
      })),
      resourceGathering: resourceGathering.value.map(gather => {
        // Strip the computed 'cost' field - it doesn't exist in defaults.json
        const exported: {
          name: string
          timeSeconds: number
          baseCost: number
          inputs?: typeof gather.inputs
          vendorValue: number
          marketPrice: number
        } = {
          name: gather.name,
          timeSeconds: gather.timeSeconds,
          baseCost: gather.baseCost,
          vendorValue: gather.vendorValue,
          marketPrice: gather.marketPrice,
        }
        // Only include inputs if they exist
        if (gather.inputs && gather.inputs.length > 0) {
          exported.inputs = gather.inputs
        }
        return exported
      }),
      magicFindDefaults: magicFindDefaults.value,
      marketTaxRate: marketTaxRate.value,
    }

    // Return pretty-printed JSON with 2-space indentation
    return JSON.stringify(exportData, null, 2)
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
    updateHashedId,
    updateVendorValue,

    // Clear methods
    clearCategoryOverrides,
    clearAllOverrides,

    // Utility methods
    hasOverride,
    importFromApiCache,
    reloadOverrides,
    getOverrideStats,

    // Refresh exclusion methods
    setRefreshExcluded,
    isRefreshExcluded,
    setAllRefreshExcluded,
    getExclusionStats,

    // Export methods
    exportAsDefaultsJson,

    // Potion craft methods
    addPotionCraft,
    updatePotionCraftTime,
    removePotionCraft,
    addMaterial,
    addPotion,
    updateRecipeDefaults,
  }
}

/**
 * Data provider composable (singleton)
 *
 * Returns the same reactive data instance on every call.
 * This ensures all components share the same reactive state.
 */
export function useDataProvider() {
  if (!dataProviderInstance) {
    dataProviderInstance = createDataProvider()
  }
  return dataProviderInstance
}
