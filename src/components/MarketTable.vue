<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataProvider } from '../composables/useDataProvider'
import { useMarketRefresh } from '../composables/useMarketRefresh'
import { storageManager } from '../storage/persistence'
import { useToast } from '../composables/useToast'
import EditableValue from './EditableValue.vue'
import HashedIdModal from './HashedIdModal.vue'
import type { RefreshCategory } from '../composables/useMarketRefresh'

// Vendor-sold items (vials, crystals) with their buy prices from NPC shops.
// These items are not tradable on the market, so we use known buy prices.
const VENDOR_BUY_PRICES: Record<string, number> = {
  '3Zbym56qLx61NBRp7Eek': 5,    // Cheap Vial
  'BRn3x72JQ2OrNzOMok41': 5,    // Cheap Crystal
  'oZwey82VNAnPYD0dXM3g': 10,   // Tarnished Vial
  'gGZ2J71yYKwxYMmjbown': 10,   // Tarnished Crystal
  'JZdg5V3PQoXyNEyWq0zl': 50,  // Gleaming Vial
  'yav4OK1wNEyWNZP7rzJb': 50,   // Gleaming Crystal
  'JVM29l7kQZ0mY80q6WDG': 200,  // Elemental Vial
  'oaJydnOmQWV9LbgRe5ME': 200,  // Elemental Crystal
  '93R0qXalLl9xQAbn8DBg': 500,  // Eldritch Vial
  'ZqEegBydNwAmLkA59J61': 500,   // Eldritch Crystal
  '1rZXlwg5YvVkYk9joDmG': 2500, // Arcane Vial
  '3Zbym56qLxZENBRp7Eek': 2500, // Arcane Crystal
}

const dataProvider = useDataProvider()
const marketRefresh = useMarketRefresh()
const { showToast } = useToast()

// Check if API key is configured
const hasApiKey = computed(() => {
  const settings = storageManager.getSettings()
  return settings.apiKey !== null && settings.apiKey !== ''
})

// Count of untracked potions (for Track All button)
const untrackedPotionCount = computed(() => {
  return dataProvider.recipes.value.filter(
    (r) => isUntrackedPotionRecipe(r.name, r.producesItemName) && r.hashedId
  ).length
})

// Search state
const searchQuery = ref('')

// Section collapse state
const sectionsExpanded = ref({
  materials: true,
  potions: true,
  resources: true,
  recipes: false, // Collapsed by default due to 345 items
})

// Per-item refresh loading state
const itemRefreshLoading = ref<Record<string, boolean>>({})

// Show refresh estimate modal
const showRefreshEstimate = ref(false)

// Hashed ID modal state
const hashedIdModalVisible = ref(false)
const hashedIdModalItem = ref<{
  itemName: string
  itemId: string
  category: 'materials' | 'potions' | 'resources' | 'recipes'
  currentHashedId: string
} | null>(null)

// Get default values for reset functionality
const getDefaultMaterialPrice = (id: string): number => {
  const item = dataProvider.materials.value.find((m) => m.id === id)
  return item?.price ?? 0
}

const getDefaultPotionPrice = (id: string): number => {
  const item = dataProvider.potions.value.find((p) => p.id === id)
  return item?.price ?? 0
}

const getDefaultResourcePrice = (id: string): number => {
  const item = dataProvider.resources.value.find((r) => r.id === id)
  return item?.marketPrice ?? 0
}

const getDefaultRecipePrice = (id: string): number => {
  const item = dataProvider.recipes.value.find((r) => r.id === id)
  return item?.price ?? 0
}

// Filtered data based on search query
const filteredMaterials = computed(() => {
  if (!searchQuery.value) return dataProvider.materials.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.materials.value.filter((m) => m.name.toLowerCase().includes(query))
})

const filteredPotions = computed(() => {
  if (!searchQuery.value) return dataProvider.potions.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.potions.value.filter((p) => p.name.toLowerCase().includes(query))
})

const filteredResources = computed(() => {
  if (!searchQuery.value) return dataProvider.resources.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.resources.value.filter((r) => r.name.toLowerCase().includes(query))
})

const filteredRecipes = computed(() => {
  if (!searchQuery.value) return dataProvider.recipes.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.recipes.value.filter((r) => r.name.toLowerCase().includes(query))
})

// Has results
const hasResults = computed(() => {
  return (
    filteredMaterials.value.length > 0 ||
    filteredPotions.value.length > 0 ||
    filteredResources.value.length > 0 ||
    filteredRecipes.value.length > 0
  )
})

// Toggle section
const toggleSection = (section: keyof typeof sectionsExpanded.value) => {
  sectionsExpanded.value[section] = !sectionsExpanded.value[section]
}

// Reset handlers
const resetMaterialsToDefaults = () => {
  if (
    confirm(
      'Reset all material prices to default values? This will clear all your custom prices for materials.'
    )
  ) {
    dataProvider.clearCategoryOverrides('materials')
  }
}

const resetPotionsToDefaults = () => {
  if (
    confirm(
      'Reset all potion prices to default values? This will clear all your custom prices for potions.'
    )
  ) {
    dataProvider.clearCategoryOverrides('potions')
  }
}

const resetResourcesToDefaults = () => {
  if (
    confirm(
      'Reset all resource prices to default values? This will clear all your custom prices for resources.'
    )
  ) {
    dataProvider.clearCategoryOverrides('resources')
  }
}

const resetRecipesToDefaults = () => {
  if (
    confirm(
      'Reset all recipe prices to default values? This will clear all your custom prices for recipes.'
    )
  ) {
    dataProvider.clearCategoryOverrides('recipes')
  }
}

const resetAllToDefaults = () => {
  if (
    confirm(
      'Reset ALL market data to default values? This will clear all your custom overrides for materials, potions, resources, and recipes.'
    )
  ) {
    dataProvider.clearAllOverrides()
  }
}

// Update handlers
const updateMaterialPrice = (id: string, price: number) => {
  dataProvider.updateMaterialPrice(id, price)
}

const updatePotionPrice = (id: string, price: number) => {
  dataProvider.updatePotionPrice(id, price)
}

const updateResourcePrice = (id: string, marketPrice: number) => {
  dataProvider.updateResourcePrice(id, marketPrice)
}

const updateRecipePrice = (id: string, price: number) => {
  dataProvider.updateRecipe(id, { price })
}

// Get override stats
const overrideStats = computed(() => dataProvider.getOverrideStats())

// Get exclusion stats
const exclusionStats = computed(() => dataProvider.getExclusionStats())

// Refresh estimate
const refreshEstimate = computed(() => marketRefresh.getRefreshEstimate())

// Format minutes for display
const formatMinutes = (minutes: number): string => {
  if (minutes < 1) return 'less than 1 min'
  if (minutes === 1) return '1 min'
  return `~${minutes} min`
}

// Start refresh all
const startRefreshAll = () => {
  if (!hasApiKey.value) {
    showToast('API key required to refresh prices', 'error')
    return
  }

  showRefreshEstimate.value = false

  // Start the refresh with progress callback
  marketRefresh
    .refreshAllItems({
      onProgress: () => {
        // Progress is tracked reactively via marketRefresh.refreshProgress
      },
    })
    .then(() => {
      const errors = marketRefresh.refreshErrors.value
      const successCount = marketRefresh.refreshProgress.value.current - errors.length
      const skippedCount = marketRefresh.refreshProgress.value.skippedCount

      if (errors.length === 0) {
        showToast(
          `Refreshed ${successCount} items successfully! ${skippedCount} items skipped (excluded).`,
          'success'
        )
      } else {
        showToast(
          `Refreshed ${successCount} items with ${errors.length} errors. ${skippedCount} items skipped (excluded).`,
          'warning'
        )
      }
    })
    .catch((error) => {
      showToast(`Refresh failed: ${error.message}`, 'error')
    })
}

// Cancel refresh
const cancelRefresh = () => {
  marketRefresh.cancelRefresh()
  showToast('Refresh cancelled', 'info')
}

// Refresh single item
const refreshItem = async (category: RefreshCategory, itemId: string) => {
  if (!hasApiKey.value) {
    showToast('API key required to refresh prices', 'error')
    return
  }

  const key = `${category}-${itemId}`
  itemRefreshLoading.value[key] = true

  try {
    const result = await marketRefresh.refreshItemPrice(category, itemId)

    if (result.success) {
      showToast(`Updated ${result.itemName}: ${result.newPrice} gold`, 'success')
    } else {
      showToast(`Failed to refresh ${result.itemName}: ${result.error}`, 'error')
    }
  } catch (error) {
    showToast(
      `Error refreshing item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    )
  } finally {
    itemRefreshLoading.value[key] = false
  }
}

// Toggle exclusion for single item
const toggleExclusion = (category: RefreshCategory, itemId: string) => {
  const currentState = dataProvider.isRefreshExcluded(category, itemId)
  dataProvider.setRefreshExcluded(category, itemId, !currentState)
}

// Toggle exclusion for entire category
const toggleCategoryExclusion = (category: RefreshCategory) => {
  const stats = dataProvider.getExclusionStats(category)
  const allExcluded = stats.excluded === stats.total

  // If all excluded, include all. Otherwise, exclude all.
  dataProvider.setAllRefreshExcluded(category, !allExcluded)
}

// Get three-state checkbox state for category
const getCategoryExclusionState = (category: RefreshCategory): 'all' | 'none' | 'mixed' => {
  const stats = dataProvider.getExclusionStats(category)

  if (stats.excluded === 0) return 'none'
  if (stats.excluded === stats.total) return 'all'
  return 'mixed'
}

// Check if a recipe produces a potion that's not yet tracked
const isUntrackedPotionRecipe = (recipeName: string, producesItemName?: string): boolean => {
  // Determine what potion this recipe produces
  const potionName = producesItemName || inferPotionName(recipeName)
  if (!potionName) return false

  // If producesItemName is not set AND the recipe name doesn't contain "Recipe",
  // this is likely not a craftable recipe (could be fishing loot, equipment, etc.)
  if (!producesItemName && !recipeName.toLowerCase().includes('recipe')) {
    return false
  }

  // Check if the potion is already tracked in potionCrafts
  const isTracked = dataProvider.potionCrafts.value.some(
    (craft) => craft.name === potionName
  )

  return !isTracked
}

// Infer potion name from recipe name by stripping "Recipe" and "(Untradable)" suffixes
const inferPotionName = (recipeName: string): string | null => {
  const cleaned = recipeName
    .replace(/\s*\(Untradable\)\s*/i, '')
    .replace(/\s*Recipe\s*$/i, '')
    .trim()
  return cleaned || null
}

// Get default crafting time in seconds based on recipe level
const getCraftTimeForLevel = (level: number): number => {
  if (level <= 6) return 132.7
  if (level <= 17) return 309.7
  if (level <= 25) return 584.1
  if (level <= 52) return 796.5
  if (level <= 85) return 1061.9
  return 1327.4
}

// Loading state for adding recipes
const addRecipeLoading = ref<Record<string, boolean>>({})

// Loading state for refreshing item data
const refreshItemDataLoading = ref(false)

// Track All Untracked Potions state
const trackAllLoading = ref(false)
const trackAllProgress = ref({ current: 0, total: 0 })
const trackAllAborted = ref(false)

// Add an untracked potion recipe to potionCrafts
// Recursively adds missing materials and fetches market prices from the API
// Returns true on success, false on failure
const addUntrackedPotion = async (
  recipe: {
    id: string
    name: string
    hashedId?: string
    producesItemName?: string
  },
  silent = false
): Promise<boolean> => {
  const potionName = recipe.producesItemName || inferPotionName(recipe.name)
  if (!potionName) {
    if (!silent) {
      showToast('Cannot determine which potion this recipe produces.', 'error')
    }
    return false
  }

  if (!recipe.hashedId) {
    if (!silent) {
      showToast('Recipe is missing a hashed ID. Please set it first.', 'error')
    }
    return false
  }

  // Set loading state
  addRecipeLoading.value[recipe.id] = true

  try {
    const { inspectItem, searchItems, getAverageMarketPrice } = await import('../api/services')

    // Step 1: Inspect the recipe item to get materials and crafting info
    const recipeDetails = await inspectItem(recipe.hashedId)

    if (!recipeDetails?.recipe) {
      if (!silent) {
        showToast(`No recipe details found for "${recipe.name}". Check the browser console.`, 'error')
      }
      console.error(
        `[AddPotion] No recipe data for "${recipe.name}" (type: ${recipeDetails?.type || 'unknown'}). Full response:`,
        JSON.stringify(recipeDetails, null, 2)
      )
      return false
    }

    const recipeData = recipeDetails.recipe

    // Step 2: For each material, ensure it exists in data with a market price
    const materials: Array<{ name: string; quantity: number; unitCost: number }> = []

    for (const mat of recipeData.materials) {
      let material = dataProvider.materials.value.find((m) => m.name === mat.item_name)

      if (!material) {
        // Material doesn't exist — add it with hashed ID from the recipe, fetch its market price
        console.log(`[AddPotion] Material "${mat.item_name}" not found, fetching from API...`)

        let price = 0
        let vendorValue = 0
        if (mat.hashed_item_id) {
          // Check if this is a known vendor item (vials, crystals) with a fixed buy price
          const vendorBuyPrice = VENDOR_BUY_PRICES[mat.hashed_item_id]
          if (vendorBuyPrice) {
            price = vendorBuyPrice
            vendorValue = vendorBuyPrice
            console.log(`[AddPotion] Using known vendor buy price for "${mat.item_name}": ${price}`)
          } else {
            const avgPrice = await getAverageMarketPrice(mat.hashed_item_id)
            price = avgPrice ?? 0
            console.log(`[AddPotion] Fetched market price for "${mat.item_name}": ${price}`)
          }
        }

        dataProvider.addMaterial({
          name: mat.item_name,
          price,
          hashedId: mat.hashed_item_id || '',
          vendorValue,
        })
        material = { id: '', name: mat.item_name, price, hashedId: mat.hashed_item_id }
      } else if (material.price === 0 && material.hashedId) {
        // Material exists but has no price — check vendor buy prices first, then market
        console.log(`[AddPotion] Material "${material.name}" has price 0, fetching...`)
        const vendorBuyPrice = VENDOR_BUY_PRICES[material.hashedId]
        if (vendorBuyPrice) {
          dataProvider.updateMaterialPrice(material.id, vendorBuyPrice)
          material = { ...material, price: vendorBuyPrice }
          console.log(`[AddPotion] Using known vendor buy price for "${material.name}": ${vendorBuyPrice}`)
        } else {
          const avgPrice = await getAverageMarketPrice(material.hashedId)
          if (avgPrice && avgPrice > 0) {
            dataProvider.updateMaterialPrice(material.id, avgPrice)
            material = { ...material, price: avgPrice }
            console.log(`[AddPotion] Updated market price for "${material.name}": ${avgPrice}`)
          }
        }
      }

      materials.push({
        name: mat.item_name,
        quantity: mat.quantity,
        unitCost: material.price,
      })
    }

    // Step 3: Get or fetch the potion's market price
    // Use the result item from the recipe if available
    let potionPrice = 0
    const existingPotion = dataProvider.potions.value.find((p) => p.name === potionName)

    if (existingPotion) {
      potionPrice = existingPotion.price
    } else {
      // Potion not in data — use recipe result hashed ID or search by name
      const potionHashedId = recipeData.result?.hashed_item_id
      console.log(`[AddPotion] Potion "${potionName}" not in data, fetching price...`)

      if (potionHashedId) {
        const avgPrice = await getAverageMarketPrice(potionHashedId)
        potionPrice = avgPrice ?? 0
        console.log(`[AddPotion] Fetched potion price for "${potionName}": ${potionPrice}`)

        dataProvider.addPotion({
          name: potionName,
          price: potionPrice,
          hashedId: potionHashedId,
        })
      } else {
        // Fallback: search by name
        const searchResult = await searchItems(potionName)
        const potionItem = searchResult.items.find(
          (item) => item.name.toLowerCase() === potionName.toLowerCase()
        ) || searchResult.items[0]

        if (potionItem) {
          const avgPrice = await getAverageMarketPrice(potionItem.hashed_id)
          potionPrice = avgPrice ?? 0

          dataProvider.addPotion({
            name: potionName,
            price: potionPrice,
            hashedId: potionItem.hashed_id,
            vendorValue: potionItem.vendor_price ?? 0,
          })
        }
      }
    }

    // Step 4: Update this recipe and its counterpart with uses and producesItemName
    const maxUses = recipeData.max_uses ?? undefined
    const recipeUpdate = {
      producesItemName: potionName,
      ...(maxUses !== undefined && maxUses !== null ? { uses: maxUses } : {}),
    }

    // Update the clicked recipe
    dataProvider.updateRecipeDefaults(recipe.id, recipeUpdate)

    // Find and update the counterpart (tradable↔untradable)
    const baseName = recipe.name.replace(/\s*\(Untradable\)\s*/i, '')
    const counterparts = dataProvider.recipes.value.filter(
      (r) => r.id !== recipe.id && r.name.replace(/\s*\(Untradable\)\s*/i, '') === baseName
    )
    for (const counterpart of counterparts) {
      dataProvider.updateRecipeDefaults(counterpart.id, recipeUpdate)
    }

    console.log(`[AddPotion] Updated recipe "${recipe.name}" and ${counterparts.length} counterpart(s) with uses=${maxUses}, producesItemName="${potionName}"`)

    // Step 5: Create the PotionCraft entry
    const craftTime = getCraftTimeForLevel(recipeData.level_required)
    const skill: 'alchemy' | 'forging' | undefined =
      recipeData.skill === 'alchemy' ? 'alchemy' :
      recipeData.skill === 'forging' ? 'forging' :
      undefined
    const potionCraft = {
      name: potionName,
      timeSeconds: craftTime,
      materials,
      currentPrice: potionPrice,
      skill,
    }

    dataProvider.addPotionCraft(potionCraft)

    if (!silent) {
      showToast(
        `Added "${potionName}" with ${materials.length} materials! Check the Potions tab.`,
        'success'
      )
    }
    return true
  } catch (error) {
    console.error('Failed to add potion:', error)
    if (!silent) {
      showToast('Failed to add potion. Check browser console for details.', 'error')
    }
    return false
  } finally {
    addRecipeLoading.value[recipe.id] = false
  }
}

// Track all untracked potion recipes at once
const trackAllUntrackedPotions = async () => {
  // Check API key
  if (!hasApiKey.value) {
    showToast('API key required to track potions.', 'error')
    return
  }

  // Filter to untracked recipes with hashedId
  const untrackedRecipes = dataProvider.recipes.value.filter(
    (r) => isUntrackedPotionRecipe(r.name, r.producesItemName) && r.hashedId
  )

  if (untrackedRecipes.length === 0) {
    showToast('No untracked potions found.', 'info')
    return
  }

  // Initialize progress tracking
  trackAllLoading.value = true
  trackAllAborted.value = false
  trackAllProgress.value = { current: 0, total: untrackedRecipes.length }

  let successCount = 0
  let failCount = 0
  let skipCount = 0

  // Process recipes sequentially to respect API rate limits
  for (const recipe of untrackedRecipes) {
    // Check for cancellation
    if (trackAllAborted.value) {
      showToast(
        `Cancelled. Tracked ${successCount} potions.`,
        'info'
      )
      trackAllLoading.value = false
      return
    }

    trackAllProgress.value.current++

    // Re-check: recipe may have been tracked by a sibling variant (tradable/untradable)
    if (!isUntrackedPotionRecipe(recipe.name, recipe.producesItemName)) {
      skipCount++
      continue
    }

    // Call with silent=true to suppress individual toasts during bulk operations
    const success = await addUntrackedPotion(recipe, true)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  // Show summary
  const parts = [`Tracked ${successCount} potions`]
  if (skipCount > 0) parts.push(`${skipCount} skipped as duplicates`)
  if (failCount > 0) parts.push(`${failCount} failed`)

  showToast(
    `${parts.join(', ')}.`,
    failCount > 0 ? 'warning' : 'success'
  )

  // Reset state
  trackAllLoading.value = false
}

// Cancel the Track All operation
const cancelTrackAll = () => {
  trackAllAborted.value = true
}

// Hashed ID modal functions
const openHashedIdModal = (
  category: 'materials' | 'potions' | 'resources' | 'recipes',
  item: { id: string; name: string; hashedId?: string }
) => {
  hashedIdModalItem.value = {
    itemName: item.name,
    itemId: item.id,
    category,
    currentHashedId: item.hashedId || '',
  }
  hashedIdModalVisible.value = true
}

const saveHashedId = (newHashedId: string) => {
  if (!hashedIdModalItem.value) return

  const { category, itemId, itemName, currentHashedId } = hashedIdModalItem.value

  // Update via dataProvider
  dataProvider.updateHashedId(category, itemId, newHashedId)

  // Show toast notification
  if (newHashedId === '' && currentHashedId === '') {
    // No-op: both empty, don't show toast (this shouldn't happen due to modal logic)
    return
  } else if (newHashedId === '') {
    showToast(`Cleared hashed ID for ${itemName}`, 'info')
  } else {
    showToast(`Updated hashed ID for ${itemName}`, 'success')
  }
}

const refreshItemData = async () => {
  if (!hashedIdModalItem.value) return

  const { category, itemId, itemName, currentHashedId } = hashedIdModalItem.value

  if (!currentHashedId) {
    showToast('No hashed ID set for this item', 'error')
    return
  }

  refreshItemDataLoading.value = true

  try {
    const { inspectItem } = await import('../api/services')
    const { generateCacheKey, invalidate } = await import('../api/cache')

    // Invalidate cache to ensure fresh data
    const cacheKey = generateCacheKey(`/item/${currentHashedId}/inspect`)
    invalidate(cacheKey)

    // Fetch item details
    const itemDetails = await inspectItem(currentHashedId)

    if (!itemDetails) {
      showToast(`Failed to fetch data for ${itemName}`, 'error')
      return
    }

    // Update vendor value for ALL categories
    if (itemDetails.vendor_price !== undefined && itemDetails.vendor_price !== null) {
      dataProvider.updateVendorValue(category, itemId, itemDetails.vendor_price)
    }

    // Update recipe-specific fields if this item has recipe data
    if (itemDetails.recipe && category === 'recipes') {
      const recipeUpdate: {
        uses?: number
        producesItemName?: string
        producesItemHashedId?: string
      } = {}

      // Extract max_uses
      if (itemDetails.recipe.max_uses !== undefined && itemDetails.recipe.max_uses !== null) {
        recipeUpdate.uses = itemDetails.recipe.max_uses
      }

      // Extract producesItemName and producesItemHashedId
      if (itemDetails.recipe.result) {
        if (itemDetails.recipe.result.item_name) {
          recipeUpdate.producesItemName = itemDetails.recipe.result.item_name
        }
        if (itemDetails.recipe.result.hashed_item_id) {
          recipeUpdate.producesItemHashedId = itemDetails.recipe.result.hashed_item_id
        }
      }

      // Update the current recipe
      dataProvider.updateRecipeDefaults(itemId, recipeUpdate)

      // Find and update the counterpart (tradable ↔ untradable)
      const recipe = dataProvider.recipes.value.find((r) => r.id === itemId)
      if (recipe) {
        const baseName = recipe.name.replace(/\s*\(Untradable\)\s*/i, '')
        const counterparts = dataProvider.recipes.value.filter(
          (r) => r.id !== itemId && r.name.replace(/\s*\(Untradable\)\s*/i, '') === baseName
        )
        for (const counterpart of counterparts) {
          dataProvider.updateRecipeDefaults(counterpart.id, recipeUpdate)
        }

        console.log(
          `[RefreshItemData] Updated recipe "${recipe.name}" and ${counterparts.length} counterpart(s) with uses=${recipeUpdate.uses ?? 'unchanged'}, producesItemName="${recipeUpdate.producesItemName ?? 'unchanged'}"`
        )
      }

      showToast(`Updated ${itemName} with fresh data from API`, 'success')
    } else {
      // Non-recipe item or recipe with no recipe data
      showToast(`Updated vendor value for ${itemName}`, 'success')
    }
  } catch (error) {
    console.error('[RefreshItemData] Failed to refresh item data:', error)
    showToast(
      `Failed to refresh ${itemName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    )
  } finally {
    refreshItemDataLoading.value = false
  }
}
</script>

<template>
  <div class="market-table">
    <!-- Search Bar -->
    <div class="search-bar-container">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search items... (e.g., 'Moose', 'Wraithbane', 'Coal')"
        />
        <div class="search-stats">
          <span v-if="searchQuery" class="search-count">
            {{
              filteredMaterials.length +
              filteredPotions.length +
              filteredResources.length +
              filteredRecipes.length
            }}
            results
          </span>
          <span class="override-count" :class="{ active: overrideStats.total > 0 }">
            {{ overrideStats.total }} overrides
          </span>
          <span
            class="exclusion-count"
            :class="{ active: (exclusionStats.totalExcluded ?? 0) > 0 }"
          >
            {{ exclusionStats.totalExcluded ?? 0 }} excluded
          </span>
        </div>
      </div>
      <button
        class="btn-refresh-all"
        :disabled="!hasApiKey || marketRefresh.isRefreshing.value"
        :title="hasApiKey ? 'Refresh all market prices from API' : 'API key required'"
        @click="showRefreshEstimate = true"
      >
        <svg
          v-if="!marketRefresh.isRefreshing.value"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span v-if="marketRefresh.isRefreshing.value" class="spinner"></span>
        {{ marketRefresh.isRefreshing.value ? 'Refreshing...' : 'Refresh All Prices' }}
      </button>
      <button class="btn-reset-all" title="Reset all to defaults" @click="resetAllToDefaults">
        Reset All
      </button>
    </div>

    <!-- Refresh Progress Bar -->
    <div v-if="marketRefresh.isRefreshing.value" class="refresh-progress-container">
      <div class="refresh-progress-header">
        <div class="refresh-progress-text">
          <span class="refresh-progress-current">{{
            marketRefresh.refreshProgress.value.currentItem
          }}</span>
          <span class="refresh-progress-count">
            {{ marketRefresh.refreshProgress.value.current }} /
            {{ marketRefresh.refreshProgress.value.totalIncluded }} ({{
              marketRefresh.refreshProgress.value.skippedCount
            }}
            skipped)
          </span>
        </div>
        <button class="btn-cancel-refresh" @click="cancelRefresh">Cancel</button>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{
            width:
              marketRefresh.refreshProgress.value.totalIncluded > 0
                ? `${(marketRefresh.refreshProgress.value.current / marketRefresh.refreshProgress.value.totalIncluded) * 100}%`
                : '0%',
          }"
        ></div>
      </div>
    </div>

    <!-- Refresh Estimate Modal -->
    <div v-if="showRefreshEstimate" class="modal-overlay" @click.self="showRefreshEstimate = false">
      <div class="modal-content-small">
        <div class="modal-header-small">
          <h3>Refresh All Market Prices</h3>
          <button class="btn-close-modal" @click="showRefreshEstimate = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="estimate-text">
            This will refresh
            <strong
              >{{ refreshEstimate.includedItems }} of {{ refreshEstimate.totalItems }} items</strong
            >
            from the API.
          </p>
          <p v-if="refreshEstimate.excludedItems > 0" class="estimate-excluded">
            {{ refreshEstimate.excludedItems }} items are excluded and will be skipped.
          </p>
          <p class="estimate-time">
            Estimated time: <strong>{{ formatMinutes(refreshEstimate.estimatedMinutes) }}</strong>
          </p>
          <div class="modal-actions">
            <button class="btn-confirm" @click="startRefreshAll">Start Refresh</button>
            <button class="btn-cancel-modal" @click="showRefreshEstimate = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hashed ID Modal -->
    <HashedIdModal
      v-if="hashedIdModalItem"
      v-model:visible="hashedIdModalVisible"
      :item-name="hashedIdModalItem.itemName"
      :item-id="hashedIdModalItem.itemId"
      :category="hashedIdModalItem.category"
      :current-hashed-id="hashedIdModalItem.currentHashedId"
      :refreshing="refreshItemDataLoading"
      @save="saveHashedId"
      @refresh="refreshItemData"
    />

    <!-- Empty State -->
    <div v-if="!hasResults" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No items match your search</h3>
      <p>Try a different search term or clear your search to see all items.</p>
    </div>

    <!-- Materials Section -->
    <section
      v-if="filteredMaterials.length > 0"
      class="market-section"
      :class="{ collapsed: !sectionsExpanded.materials }"
    >
      <div class="section-header" @click="toggleSection('materials')">
        <div class="section-title">
          <span class="expand-icon">{{ sectionsExpanded.materials ? '▼' : '▶' }}</span>
          <h2>Materials</h2>
          <span class="item-count">{{ filteredMaterials.length }} items</span>
          <span v-if="overrideStats.materials > 0" class="override-badge">
            {{ overrideStats.materials }} overridden
          </span>
          <span
            v-if="(dataProvider.getExclusionStats('materials')?.excluded ?? 0) > 0"
            class="exclusion-badge"
          >
            {{ dataProvider.getExclusionStats('materials')?.excluded ?? 0 }} excluded
          </span>
        </div>
        <div class="section-actions">
          <button
            class="btn-toggle-exclusion"
            :title="
              getCategoryExclusionState('materials') === 'all'
                ? 'Include all materials in refresh'
                : 'Exclude all materials from refresh'
            "
            @click.stop="toggleCategoryExclusion('materials')"
          >
            <span v-if="getCategoryExclusionState('materials') === 'all'">☑</span>
            <span v-else-if="getCategoryExclusionState('materials') === 'mixed'">▣</span>
            <span v-else>☐</span>
            {{ getCategoryExclusionState('materials') === 'all' ? 'Include All' : 'Exclude All' }}
          </button>
          <button
            class="btn-reset-section"
            title="Reset materials to defaults"
            @click.stop="resetMaterialsToDefaults"
          >
            Reset Section
          </button>
        </div>
      </div>
      <div v-if="sectionsExpanded.materials" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-exclude">Exclude</th>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="material in filteredMaterials"
              :key="material.id"
              :class="{ excluded: dataProvider.isRefreshExcluded('materials', material.id) }"
            >
              <td class="col-exclude">
                <input
                  type="checkbox"
                  :checked="dataProvider.isRefreshExcluded('materials', material.id)"
                  :title="
                    dataProvider.isRefreshExcluded('materials', material.id)
                      ? 'Include in refresh'
                      : 'Exclude from refresh'
                  "
                  @change="toggleExclusion('materials', material.id)"
                />
              </td>
              <td class="col-name">{{ material.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">
                  {{
                    material.vendorValue ? `${material.vendorValue.toLocaleString()} gold` : 'N/A'
                  }}
                </span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="material.price"
                  :default-value="getDefaultMaterialPrice(material.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updateMaterialPrice(material.id, value)"
                />
              </td>
              <td class="col-actions">
                <div class="actions-wrapper">
                  <button
                    class="btn-hashed-id"
                    :class="{ missing: !material.hashedId }"
                    title="View/edit hashed ID"
                    @click="openHashedIdModal('materials', material)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="4" y1="9" x2="20" y2="9"></line>
                      <line x1="4" y1="15" x2="20" y2="15"></line>
                      <line x1="10" y1="3" x2="8" y2="21"></line>
                      <line x1="16" y1="3" x2="14" y2="21"></line>
                    </svg>
                  </button>
                  <button
                    class="btn-refresh-item"
                    :disabled="!hasApiKey || itemRefreshLoading[`materials-${material.id}`]"
                    :title="hasApiKey ? 'Refresh this item from API' : 'API key required'"
                    @click="refreshItem('materials', material.id)"
                  >
                  <span
                    v-if="itemRefreshLoading[`materials-${material.id}`]"
                    class="spinner-small"
                  ></span>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Potions Section -->
    <section
      v-if="filteredPotions.length > 0"
      class="market-section"
      :class="{ collapsed: !sectionsExpanded.potions }"
    >
      <div class="section-header" @click="toggleSection('potions')">
        <div class="section-title">
          <span class="expand-icon">{{ sectionsExpanded.potions ? '▼' : '▶' }}</span>
          <h2>Potions</h2>
          <span class="item-count">{{ filteredPotions.length }} items</span>
          <span v-if="overrideStats.potions > 0" class="override-badge">
            {{ overrideStats.potions }} overridden
          </span>
          <span
            v-if="(dataProvider.getExclusionStats('potions')?.excluded ?? 0) > 0"
            class="exclusion-badge"
          >
            {{ dataProvider.getExclusionStats('potions')?.excluded ?? 0 }} excluded
          </span>
        </div>
        <div class="section-actions">
          <button
            class="btn-toggle-exclusion"
            :title="
              getCategoryExclusionState('potions') === 'all'
                ? 'Include all potions in refresh'
                : 'Exclude all potions from refresh'
            "
            @click.stop="toggleCategoryExclusion('potions')"
          >
            <span v-if="getCategoryExclusionState('potions') === 'all'">☑</span>
            <span v-else-if="getCategoryExclusionState('potions') === 'mixed'">▣</span>
            <span v-else>☐</span>
            {{ getCategoryExclusionState('potions') === 'all' ? 'Include All' : 'Exclude All' }}
          </button>
          <button
            class="btn-reset-section"
            title="Reset potions to defaults"
            @click.stop="resetPotionsToDefaults"
          >
            Reset Section
          </button>
        </div>
      </div>
      <div v-if="sectionsExpanded.potions" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-exclude">Exclude</th>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="potion in filteredPotions"
              :key="potion.id"
              :class="{ excluded: dataProvider.isRefreshExcluded('potions', potion.id) }"
            >
              <td class="col-exclude">
                <input
                  type="checkbox"
                  :checked="dataProvider.isRefreshExcluded('potions', potion.id)"
                  :title="
                    dataProvider.isRefreshExcluded('potions', potion.id)
                      ? 'Include in refresh'
                      : 'Exclude from refresh'
                  "
                  @change="toggleExclusion('potions', potion.id)"
                />
              </td>
              <td class="col-name">{{ potion.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">
                  {{ potion.vendorValue ? `${potion.vendorValue.toLocaleString()} gold` : 'N/A' }}
                </span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="potion.price"
                  :default-value="getDefaultPotionPrice(potion.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updatePotionPrice(potion.id, value)"
                />
              </td>
              <td class="col-actions">
                <div class="actions-wrapper">
                  <button
                    class="btn-hashed-id"
                  :class="{ missing: !potion.hashedId }"
                  title="View/edit hashed ID"
                  @click="openHashedIdModal('potions', potion)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                </button>
                <button
                  class="btn-refresh-item"
                  :disabled="!hasApiKey || itemRefreshLoading[`potions-${potion.id}`]"
                  :title="hasApiKey ? 'Refresh this item from API' : 'API key required'"
                  @click="refreshItem('potions', potion.id)"
                >
                  <span
                    v-if="itemRefreshLoading[`potions-${potion.id}`]"
                    class="spinner-small"
                  ></span>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Resources Section -->
    <section
      v-if="filteredResources.length > 0"
      class="market-section"
      :class="{ collapsed: !sectionsExpanded.resources }"
    >
      <div class="section-header" @click="toggleSection('resources')">
        <div class="section-title">
          <span class="expand-icon">{{ sectionsExpanded.resources ? '▼' : '▶' }}</span>
          <h2>Resources</h2>
          <span class="item-count">{{ filteredResources.length }} items</span>
          <span v-if="overrideStats.resources > 0" class="override-badge">
            {{ overrideStats.resources }} overridden
          </span>
          <span
            v-if="(dataProvider.getExclusionStats('resources')?.excluded ?? 0) > 0"
            class="exclusion-badge"
          >
            {{ dataProvider.getExclusionStats('resources')?.excluded ?? 0 }} excluded
          </span>
        </div>
        <div class="section-actions">
          <button
            class="btn-toggle-exclusion"
            :title="
              getCategoryExclusionState('resources') === 'all'
                ? 'Include all resources in refresh'
                : 'Exclude all resources from refresh'
            "
            @click.stop="toggleCategoryExclusion('resources')"
          >
            <span v-if="getCategoryExclusionState('resources') === 'all'">☑</span>
            <span v-else-if="getCategoryExclusionState('resources') === 'mixed'">▣</span>
            <span v-else>☐</span>
            {{ getCategoryExclusionState('resources') === 'all' ? 'Include All' : 'Exclude All' }}
          </button>
          <button
            class="btn-reset-section"
            title="Reset resources to defaults"
            @click.stop="resetResourcesToDefaults"
          >
            Reset Section
          </button>
        </div>
      </div>
      <div v-if="sectionsExpanded.resources" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-exclude">Exclude</th>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="resource in filteredResources"
              :key="resource.id"
              :class="{ excluded: dataProvider.isRefreshExcluded('resources', resource.id) }"
            >
              <td class="col-exclude">
                <input
                  type="checkbox"
                  :checked="dataProvider.isRefreshExcluded('resources', resource.id)"
                  :title="
                    dataProvider.isRefreshExcluded('resources', resource.id)
                      ? 'Include in refresh'
                      : 'Exclude from refresh'
                  "
                  @change="toggleExclusion('resources', resource.id)"
                />
              </td>
              <td class="col-name">{{ resource.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">{{ resource.vendorValue.toLocaleString() }} gold</span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="resource.marketPrice"
                  :default-value="getDefaultResourcePrice(resource.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updateResourcePrice(resource.id, value)"
                />
              </td>
              <td class="col-actions">
                <div class="actions-wrapper">
                  <button
                    class="btn-hashed-id"
                  :class="{ missing: !resource.hashedId }"
                  title="View/edit hashed ID"
                  @click="openHashedIdModal('resources', resource)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                </button>
                <button
                  class="btn-refresh-item"
                  :disabled="!hasApiKey || itemRefreshLoading[`resources-${resource.id}`]"
                  :title="hasApiKey ? 'Refresh this item from API' : 'API key required'"
                  @click="refreshItem('resources', resource.id)"
                >
                  <span
                    v-if="itemRefreshLoading[`resources-${resource.id}`]"
                    class="spinner-small"
                  ></span>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Recipes Section -->
    <section
      v-if="filteredRecipes.length > 0"
      class="market-section"
      :class="{ collapsed: !sectionsExpanded.recipes }"
    >
      <div class="section-header" @click="toggleSection('recipes')">
        <div class="section-title">
          <span class="expand-icon">{{ sectionsExpanded.recipes ? '▼' : '▶' }}</span>
          <h2>Recipes</h2>
          <span class="item-count">{{ filteredRecipes.length }} items</span>
          <span v-if="overrideStats.recipes > 0" class="override-badge">
            {{ overrideStats.recipes }} overridden
          </span>
          <span
            v-if="(dataProvider.getExclusionStats('recipes')?.excluded ?? 0) > 0"
            class="exclusion-badge"
          >
            {{ dataProvider.getExclusionStats('recipes')?.excluded ?? 0 }} excluded
          </span>
        </div>
        <div class="section-actions">
          <button
            v-if="untrackedPotionCount > 0 && !trackAllLoading"
            class="btn-track-all"
            :disabled="!hasApiKey"
            :title="hasApiKey ? 'Track all untracked potion recipes' : 'API key required'"
            @click.stop="trackAllUntrackedPotions"
          >
            Track All ({{ untrackedPotionCount }})
          </button>
          <div v-if="trackAllLoading" class="track-all-progress" @click.stop>
            <span class="progress-text">
              Tracking {{ trackAllProgress.current }}/{{ trackAllProgress.total }}...
            </span>
            <button
              class="btn-cancel-track"
              title="Cancel tracking operation"
              @click.stop="cancelTrackAll"
            >
              ✕ Cancel
            </button>
          </div>
          <button
            class="btn-toggle-exclusion"
            :title="
              getCategoryExclusionState('recipes') === 'all'
                ? 'Include all recipes in refresh'
                : 'Exclude all recipes from refresh'
            "
            @click.stop="toggleCategoryExclusion('recipes')"
          >
            <span v-if="getCategoryExclusionState('recipes') === 'all'">☑</span>
            <span v-else-if="getCategoryExclusionState('recipes') === 'mixed'">▣</span>
            <span v-else>☐</span>
            {{ getCategoryExclusionState('recipes') === 'all' ? 'Include All' : 'Exclude All' }}
          </button>
          <button
            class="btn-reset-section"
            title="Reset recipes to defaults"
            @click.stop="resetRecipesToDefaults"
          >
            Reset Section
          </button>
        </div>
      </div>
      <div v-if="sectionsExpanded.recipes" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-exclude">Exclude</th>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              :class="{ excluded: dataProvider.isRefreshExcluded('recipes', recipe.id) }"
            >
              <td class="col-exclude">
                <input
                  type="checkbox"
                  :checked="dataProvider.isRefreshExcluded('recipes', recipe.id)"
                  :title="
                    dataProvider.isRefreshExcluded('recipes', recipe.id)
                      ? 'Include in refresh'
                      : 'Exclude from refresh'
                  "
                  @change="toggleExclusion('recipes', recipe.id)"
                />
              </td>
              <td class="col-name">
                <span>{{ recipe.name }}</span>
                <span
                  v-if="isUntrackedPotionRecipe(recipe.name, recipe.producesItemName)"
                  class="untracked-badge"
                  title="This recipe produces a potion that's not yet tracked"
                >
                  Untracked Potion
                </span>
              </td>
              <td class="col-vendor">
                <span class="vendor-value">
                  {{ recipe.vendorValue ? `${recipe.vendorValue.toLocaleString()} gold` : 'N/A' }}
                </span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="recipe.price"
                  :default-value="getDefaultRecipePrice(recipe.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updateRecipePrice(recipe.id, value)"
                />
              </td>
              <td class="col-actions">
                <div class="actions-wrapper">
                  <button
                    v-if="isUntrackedPotionRecipe(recipe.name, recipe.producesItemName)"
                    class="btn-add-recipe"
                    :title="hasApiKey ? 'Add this potion to tracked potions' : 'API key required to add potion'"
                    :disabled="!hasApiKey || addRecipeLoading[recipe.id]"
                    @click="addUntrackedPotion(recipe)"
                  >
                    <span v-if="addRecipeLoading[recipe.id]">...</span>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    class="btn-hashed-id"
                  :class="{ missing: !recipe.hashedId }"
                  title="View/edit hashed ID"
                  @click="openHashedIdModal('recipes', recipe)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="4" y1="9" x2="20" y2="9"></line>
                    <line x1="4" y1="15" x2="20" y2="15"></line>
                    <line x1="10" y1="3" x2="8" y2="21"></line>
                    <line x1="16" y1="3" x2="14" y2="21"></line>
                  </svg>
                </button>
                <button
                  class="btn-refresh-item"
                  :disabled="!hasApiKey || itemRefreshLoading[`recipes-${recipe.id}`]"
                  :title="hasApiKey ? 'Refresh this item from API' : 'API key required'"
                  @click="refreshItem('recipes', recipe.id)"
                >
                  <span
                    v-if="itemRefreshLoading[`recipes-${recipe.id}`]"
                    class="spinner-small"
                  ></span>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.market-table {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Search Bar */
.search-bar-container {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--bg-primary);
  padding: 1rem 0;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.search-count {
  color: var(--text-primary);
  font-weight: 600;
}

.override-count {
  padding: 0.25rem 0.5rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
}

.override-count.active {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: var(--accent-primary);
}

.exclusion-count {
  padding: 0.25rem 0.5rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
}

.exclusion-count.active {
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--warning);
}

.btn-refresh-all {
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-refresh-all:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.btn-refresh-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reset-all {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-reset-all:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--danger);
}

/* Refresh Progress */
.refresh-progress-container {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.refresh-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.refresh-progress-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.refresh-progress-current {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.refresh-progress-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.btn-cancel-refresh {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-refresh:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: var(--bg-primary);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--accent-primary);
  transition: width 0.3s ease;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content-small {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  max-width: 500px;
  width: 100%;
}

.modal-header-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header-small h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.btn-close-modal {
  padding: 0.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.estimate-text {
  font-size: 0.875rem;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.estimate-excluded {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.estimate-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-confirm {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background-color: var(--accent-hover);
}

.btn-cancel-modal {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-modal:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

/* Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
}

/* Market Section */
.market-section {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--border-color);
}

.section-header:hover {
  background-color: var(--bg-tertiary);
}

.market-section.collapsed .section-header {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  flex-wrap: wrap;
}

.section-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.expand-icon {
  font-size: 0.875rem;
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.section-title h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.item-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.override-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.25rem;
  color: var(--accent-primary);
  font-weight: 600;
}

.exclusion-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.25rem;
  color: var(--warning);
  font-weight: 600;
}

.btn-toggle-exclusion {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-toggle-exclusion:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-track-all {
  padding: 0.375rem 0.75rem;
  background-color: var(--success);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-track-all:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--success) 80%, black);
}

.btn-track-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.track-all-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.btn-cancel-track {
  padding: 0.25rem 0.5rem;
  background-color: var(--danger);
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-cancel-track:hover {
  background-color: color-mix(in srgb, var(--danger) 85%, black);
}

.btn-reset-section {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-section:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--danger);
}

.section-content {
  overflow-x: auto;
}

/* Market Items Table */
.market-items-table {
  width: 100%;
  border-collapse: collapse;
}

.market-items-table thead {
  background-color: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-color);
}

.market-items-table th {
  padding: 0.75rem 1.5rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.market-items-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.market-items-table tbody tr:last-child td {
  border-bottom: none;
}

.market-items-table tbody tr:hover {
  background-color: var(--bg-tertiary);
}

.market-items-table tbody tr.excluded {
  opacity: 0.5;
}

.market-items-table tbody tr.excluded:hover {
  opacity: 0.7;
}

.col-exclude {
  width: 60px;
  text-align: center;
}

.col-exclude input[type='checkbox'] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.col-name {
  font-weight: 600;
  color: var(--text-primary);
}

.col-vendor {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.col-market {
  min-width: 200px;
}

.col-actions {
  width: 100px;
  text-align: center;
}

.actions-wrapper {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
}

.vendor-value {
  color: var(--text-secondary);
}

.btn-refresh-item {
  padding: 0.375rem;
  background-color: transparent;
  color: var(--accent-primary);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-refresh-item:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  color: var(--accent-primary);
}

.btn-refresh-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-hashed-id {
  padding: 0.375rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-hashed-id:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-hashed-id.missing {
  color: var(--warning);
}

.btn-hashed-id.missing:hover {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.btn-add-recipe {
  padding: 0.375rem;
  background-color: transparent;
  color: var(--success);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-add-recipe:hover {
  background-color: var(--bg-tertiary);
  color: var(--success);
}

.untracked-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.375rem;
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid var(--success);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-bar-container {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-refresh-all,
  .btn-reset-all {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .section-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-toggle-exclusion,
  .btn-reset-section,
  .btn-track-all,
  .track-all-progress {
    width: 100%;
  }

  .market-items-table th,
  .market-items-table td {
    padding: 0.75rem;
  }

  .section-title {
    flex-wrap: wrap;
  }

  .refresh-progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .btn-cancel-refresh {
    width: 100%;
  }

  .modal-overlay {
    padding: 1rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .col-actions {
    width: 80px;
  }

  .actions-wrapper {
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn-hashed-id,
  .btn-refresh-item {
    width: 100%;
  }
}
</style>
