<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataProvider } from '../composables/useDataProvider'
import { useMarketRefresh } from '../composables/useMarketRefresh'
import { storageManager } from '../storage/persistence'
import { useToast } from '../composables/useToast'
import EditableValue from './EditableValue.vue'
import HashedIdModal from './HashedIdModal.vue'
import type { RefreshCategory } from '../composables/useMarketRefresh'

const dataProvider = useDataProvider()
const marketRefresh = useMarketRefresh()
const { showToast } = useToast()

// Check if API key is configured
const hasApiKey = computed(() => {
  const settings = storageManager.getSettings()
  return settings.apiKey !== null && settings.apiKey !== ''
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
      @save="saveHashedId"
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
              <td class="col-name">{{ recipe.name }}</td>
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
  .btn-reset-section {
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
