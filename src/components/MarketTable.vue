<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataProvider } from '../composables/useDataProvider'
import EditableValue from './EditableValue.vue'

const dataProvider = useDataProvider()

// Search state
const searchQuery = ref('')

// Section collapse state
const sectionsExpanded = ref({
  materials: true,
  potions: true,
  resources: true,
  recipes: false, // Collapsed by default due to 345 items
})

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
  return dataProvider.materials.value.filter((m) =>
    m.name.toLowerCase().includes(query)
  )
})

const filteredPotions = computed(() => {
  if (!searchQuery.value) return dataProvider.potions.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.potions.value.filter((p) =>
    p.name.toLowerCase().includes(query)
  )
})

const filteredResources = computed(() => {
  if (!searchQuery.value) return dataProvider.resources.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.resources.value.filter((r) =>
    r.name.toLowerCase().includes(query)
  )
})

const filteredRecipes = computed(() => {
  if (!searchQuery.value) return dataProvider.recipes.value
  const query = searchQuery.value.toLowerCase()
  return dataProvider.recipes.value.filter((r) =>
    r.name.toLowerCase().includes(query)
  )
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
        </div>
      </div>
      <button class="btn-reset-all" title="Reset all to defaults" @click="resetAllToDefaults">
        Reset All
      </button>
    </div>

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
        </div>
        <button
          class="btn-reset-section"
          title="Reset materials to defaults"
          @click.stop="resetMaterialsToDefaults"
        >
          Reset Section
        </button>
      </div>
      <div v-if="sectionsExpanded.materials" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="material in filteredMaterials" :key="material.id">
              <td class="col-name">{{ material.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">{{ material.price.toLocaleString() }} gold</span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="material.price"
                  :default-value="getDefaultMaterialPrice(material.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updateMaterialPrice(material.id, value)"
                />
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
        </div>
        <button
          class="btn-reset-section"
          title="Reset potions to defaults"
          @click.stop="resetPotionsToDefaults"
        >
          Reset Section
        </button>
      </div>
      <div v-if="sectionsExpanded.potions" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="potion in filteredPotions" :key="potion.id">
              <td class="col-name">{{ potion.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">N/A</span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="potion.price"
                  :default-value="getDefaultPotionPrice(potion.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updatePotionPrice(potion.id, value)"
                />
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
        </div>
        <button
          class="btn-reset-section"
          title="Reset resources to defaults"
          @click.stop="resetResourcesToDefaults"
        >
          Reset Section
        </button>
      </div>
      <div v-if="sectionsExpanded.resources" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resource in filteredResources" :key="resource.id">
              <td class="col-name">{{ resource.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">N/A</span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="resource.marketPrice"
                  :default-value="getDefaultResourcePrice(resource.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updateResourcePrice(resource.id, value)"
                />
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
        </div>
        <button
          class="btn-reset-section"
          title="Reset recipes to defaults"
          @click.stop="resetRecipesToDefaults"
        >
          Reset Section
        </button>
      </div>
      <div v-if="sectionsExpanded.recipes" class="section-content">
        <table class="market-items-table">
          <thead>
            <tr>
              <th class="col-name">Name</th>
              <th class="col-vendor">Vendor Value</th>
              <th class="col-market">Market Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="recipe in filteredRecipes" :key="recipe.id">
              <td class="col-name">{{ recipe.name }}</td>
              <td class="col-vendor">
                <span class="vendor-value">N/A</span>
              </td>
              <td class="col-market">
                <EditableValue
                  :model-value="recipe.price"
                  :default-value="getDefaultRecipePrice(recipe.id)"
                  suffix=" gold"
                  @update:model-value="(value) => updateRecipePrice(recipe.id, value)"
                />
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

.vendor-value {
  color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-bar-container {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-reset-all {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

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
}
</style>
