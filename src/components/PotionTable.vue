<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PotionProfitResult } from '../calculators/potionCalculator'
import EditableValue from './EditableValue.vue'
import EmptyState from './EmptyState.vue'
import { useHeatmap } from '../composables/useHeatmap'

const { getHeatmapStyle } = useHeatmap()

const props = defineProps<{
  potions: PotionProfitResult[]
}>()

// Emit events for editing values
const emit = defineEmits<{
  (e: 'update:materialPrice', potionName: string, materialName: string, value: number): void
  (e: 'update:marketPrice', potionName: string, value: number): void
  (e: 'update:craftTime', potionName: string, value: number): void
  (e: 'delete:potion', potionName: string): void
}>()

// Expanded rows tracking
const expandedRows = ref<Set<string>>(new Set())

// Sub-tab configuration
type PotionSubTab = 'alchemy' | 'forging'
const activeSubTab = ref<PotionSubTab>('alchemy')

// Sort configuration
type SortKey = 'name' | 'totalCost' | 'currentPrice' | 'profit' | 'profitPerHour'
type SortOrder = 'asc' | 'desc'

const sortKey = ref<SortKey>('profitPerHour')
const sortOrder = ref<SortOrder>('desc')

// Computed sorted potions
const sortedPotions = computed(() => {
  const potions = [...props.potions]

  potions.sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortKey.value) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'totalCost':
        aValue = a.totalCost
        bValue = b.totalCost
        break
      case 'currentPrice':
        aValue = a.currentPrice
        bValue = b.currentPrice
        break
      case 'profit':
        aValue = a.profit
        bValue = b.profit
        break
      case 'profitPerHour':
        aValue = a.profitPerHour
        bValue = b.profitPerHour
        break
      default:
        aValue = a.profitPerHour
        bValue = b.profitPerHour
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortOrder.value === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  return potions
})

// Filter potions by active sub-tab
const filteredPotions = computed(() => {
  return sortedPotions.value.filter(p => p.skill === activeSubTab.value)
})

// Toggle row expansion
const toggleRow = (potionName: string) => {
  if (expandedRows.value.has(potionName)) {
    expandedRows.value.delete(potionName)
  } else {
    expandedRows.value.add(potionName)
  }
}

// Check if row is expanded
const isExpanded = (potionName: string): boolean => {
  return expandedRows.value.has(potionName)
}

// Toggle sort
const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc'
  }
}

// Format numbers
const formatNumber = (num: number): string => {
  return Math.round(num).toLocaleString()
}

// Get sort icon
const getSortIcon = (key: SortKey): string => {
  if (sortKey.value !== key) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Tooltip positioning for fixed tooltips (escapes table stacking contexts)
const onTooltipHover = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const tooltip = target.querySelector('.tooltip') as HTMLElement | null
  if (!tooltip) return

  const rect = target.getBoundingClientRect()
  tooltip.style.left = `${rect.left + rect.width / 2}px`
  tooltip.style.top = `${rect.top - 8}px`
  tooltip.style.transform = 'translate(-50%, -100%)'
}

// Calculate profit range for heatmap
const profitRange = computed(() => {
  // Guard against empty array: Math.min/max of empty array returns Infinity/-Infinity
  if (filteredPotions.value.length === 0) {
    return {
      profit: { min: 0, max: 0 },
      profitPerHour: { min: 0, max: 0 }
    }
  }

  const profits = filteredPotions.value.map(p => p.profit)
  const profitHours = filteredPotions.value.map(p => p.profitPerHour)
  return {
    profit: {
      min: Math.min(...profits),
      max: Math.max(...profits),
    },
    profitPerHour: {
      min: Math.min(...profitHours),
      max: Math.max(...profitHours),
    }
  }
})

// Handle inline editing
const handleMaterialPriceUpdate = (potionName: string, materialName: string, value: number) => {
  emit('update:materialPrice', potionName, materialName, value)
}

const handleMarketPriceUpdate = (potionName: string, value: number) => {
  emit('update:marketPrice', potionName, value)
}

const handleCraftTimeUpdate = (potionName: string, value: number) => {
  emit('update:craftTime', potionName, value)
}

// Format seconds into a readable string
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}
</script>

<template>
  <div class="potion-table">
    <!-- Sub-tab navigation -->
    <div class="sub-tab-navigation">
      <button
        class="sub-tab-button"
        :class="{ active: activeSubTab === 'alchemy' }"
        @click="activeSubTab = 'alchemy'"
      >
        Alchemy
      </button>
      <button
        class="sub-tab-button"
        :class="{ active: activeSubTab === 'forging' }"
        @click="activeSubTab = 'forging'"
      >
        Forging
      </button>
    </div>

    <div class="table-container">
      <!-- Empty state when no potions match the active sub-tab -->
      <EmptyState
        v-if="filteredPotions.length === 0"
        icon="🧪"
        title="No potions found"
        description="No potions match this category yet. Add potions from the Market tab."
      />

      <table v-else class="main-table mobile-card-layout" role="grid" aria-label="Potion crafting profitability">
        <thead>
          <tr>
            <th class="expand-col"></th>
            <th class="sortable" @click="toggleSort('name')">
              Potion Name {{ getSortIcon('name') }}
            </th>
            <th class="sortable text-right" @click="toggleSort('totalCost')">
              Total Cost {{ getSortIcon('totalCost') }}
            </th>
            <th class="sortable text-right" @click="toggleSort('currentPrice')">
              Market Price {{ getSortIcon('currentPrice') }}
            </th>
            <th class="sortable text-right" @click="toggleSort('profit')">
              Profit {{ getSortIcon('profit') }}
            </th>
            <th class="sortable text-right" @click="toggleSort('profitPerHour')">
              Profit/hr {{ getSortIcon('profitPerHour') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="potion in filteredPotions" :key="potion.name">
            <!-- Main Row -->
            <tr class="main-row" :class="{ expanded: isExpanded(potion.name) }">
              <td class="expand-col" data-label="">
                <button
                  class="expand-button"
                  :class="{ expanded: isExpanded(potion.name) }"
                  :title="isExpanded(potion.name) ? 'Collapse' : 'Expand'"
                  :aria-label="`${isExpanded(potion.name) ? 'Collapse' : 'Expand'} ${potion.name} details`"
                  :aria-expanded="isExpanded(potion.name)"
                  @click="toggleRow(potion.name)"
                >
                  {{ isExpanded(potion.name) ? '▼' : '▶' }}
                </button>
              </td>
              <td class="name-cell" data-label="Potion">
                {{ potion.name }}
                <button
                  class="btn-delete-potion"
                  title="Remove from potion list"
                  @click.stop="emit('delete:potion', potion.name)"
                >
                  ✕
                </button>
              </td>
              <td class="text-right" data-label="Total Cost">{{ formatNumber(potion.totalCost) }}</td>
              <td class="text-right" data-label="Market Price">
                <EditableValue
                  :model-value="potion.currentPrice"
                  :default-value="potion.currentPrice"
                  @update:model-value="(value) => handleMarketPriceUpdate(potion.name, value)"
                />
              </td>
              <td
                class="text-right"
                data-label="Profit"
                :style="getHeatmapStyle(potion.profit, profitRange.profit.min, profitRange.profit.max)"
              >
                <span v-if="potion.hasRecipeCost" class="profit-with-tooltip" @mouseenter="onTooltipHover">
                  {{ formatNumber(potion.profit) }}
                  <span class="recipe-indicator" :title="`Has recipe cost from ${potion.tradableRecipeName}`">ⓡ</span>
                  <div class="tooltip">
                    <div class="tooltip-content">
                      <div class="tooltip-title">Dual Profitability</div>
                      <div class="tooltip-row">
                        <span class="tooltip-label">With recipe cost:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.profit) }} gold</span>
                      </div>
                      <div v-if="potion.profitWithRecipeCost !== undefined" class="tooltip-row">
                        <span class="tooltip-label">Without recipe:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.profitWithRecipeCost) }} gold</span>
                      </div>
                      <hr class="tooltip-divider">
                      <div class="tooltip-row small">
                        <span class="tooltip-label">Recipe:</span>
                        <span class="tooltip-value">{{ potion.tradableRecipeName }}</span>
                      </div>
                      <div v-if="potion.tradableRecipePrice !== undefined" class="tooltip-row small">
                        <span class="tooltip-label">Recipe price:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.tradableRecipePrice) }} gold</span>
                      </div>
                      <div v-if="potion.recipeUses !== undefined" class="tooltip-row small">
                        <span class="tooltip-label">Uses:</span>
                        <span class="tooltip-value">{{ potion.recipeUses }}x</span>
                      </div>
                      <div v-if="potion.recipeCostPerCraft !== undefined" class="tooltip-row small">
                        <span class="tooltip-label">Cost per craft:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.recipeCostPerCraft) }} gold</span>
                      </div>
                    </div>
                  </div>
                </span>
                <span v-else>{{ formatNumber(potion.profit) }}</span>
              </td>
              <td
                class="text-right profit-hr"
                data-label="Profit/hr"
                :style="getHeatmapStyle(potion.profitPerHour, profitRange.profitPerHour.min, profitRange.profitPerHour.max)"
              >
                <span v-if="potion.hasRecipeCost" class="profit-with-tooltip" @mouseenter="onTooltipHover">
                  {{ formatNumber(potion.profitPerHour) }}
                  <span class="recipe-indicator" :title="`Has recipe cost from ${potion.tradableRecipeName}`">ⓡ</span>
                  <div class="tooltip">
                    <div class="tooltip-content">
                      <div class="tooltip-title">Dual Profitability (per hour)</div>
                      <div class="tooltip-row">
                        <span class="tooltip-label">With recipe cost:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.profitPerHour) }} gold/hr</span>
                      </div>
                      <div v-if="potion.profitPerHourWithRecipeCost !== undefined" class="tooltip-row">
                        <span class="tooltip-label">Without recipe:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.profitPerHourWithRecipeCost) }} gold/hr</span>
                      </div>
                      <hr class="tooltip-divider">
                      <div class="tooltip-row small">
                        <span class="tooltip-label">Recipe:</span>
                        <span class="tooltip-value">{{ potion.tradableRecipeName }}</span>
                      </div>
                      <div v-if="potion.tradableRecipePrice !== undefined" class="tooltip-row small">
                        <span class="tooltip-label">Recipe price:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.tradableRecipePrice) }} gold</span>
                      </div>
                      <div v-if="potion.recipeUses !== undefined" class="tooltip-row small">
                        <span class="tooltip-label">Uses:</span>
                        <span class="tooltip-value">{{ potion.recipeUses }}x</span>
                      </div>
                      <div v-if="potion.recipeCostPerCraft !== undefined" class="tooltip-row small">
                        <span class="tooltip-label">Cost per craft:</span>
                        <span class="tooltip-value">{{ formatNumber(potion.recipeCostPerCraft) }} gold</span>
                      </div>
                    </div>
                  </div>
                </span>
                <span v-else>{{ formatNumber(potion.profitPerHour) }}</span>
              </td>
            </tr>

            <!-- Expanded Row: Material Breakdown -->
            <tr v-if="isExpanded(potion.name)" class="expanded-row">
              <td colspan="6" class="expanded-content">
                <div class="material-breakdown">
                  <h4 class="breakdown-title">Material Breakdown</h4>
                  <table class="material-table">
                    <thead>
                      <tr>
                        <th>Material Name</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="material in potion.materials" :key="material.name">
                        <td>{{ material.name }}</td>
                        <td class="text-right">{{ material.quantity }}</td>
                        <td class="text-right">
                          <EditableValue
                            :model-value="material.unitCost"
                            :default-value="material.unitCost"
                            @update:model-value="(value) => handleMaterialPriceUpdate(potion.name, material.name, value)"
                          />
                        </td>
                        <td class="text-right subtotal">{{ formatNumber(material.totalCost) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="total-row">
                        <td colspan="3" class="text-right total-label">Total Cost:</td>
                        <td class="text-right total-value">{{ formatNumber(potion.totalCost) }}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <!-- Craft Time -->
                  <div class="craft-time-row">
                    <span class="craft-time-label">Craft Time:</span>
                    <EditableValue
                      :model-value="potion.craftTimeSeconds"
                      :default-value="potion.craftTimeSeconds"
                      @update:model-value="(value) => handleCraftTimeUpdate(potion.name, value)"
                    />
                    <span class="craft-time-display">({{ formatTime(potion.craftTimeSeconds) }})</span>
                  </div>

                  <!-- Recipe Cost Information -->
                  <div v-if="potion.hasRecipeCost" class="recipe-cost-section">
                    <h4 class="breakdown-title">Recipe Cost (Dual Profitability)</h4>
                    <div class="recipe-info">
                      <div class="recipe-info-row">
                        <span class="recipe-info-label">Recipe:</span>
                        <span class="recipe-info-value">{{ potion.tradableRecipeName }}</span>
                      </div>
                      <div v-if="potion.tradableRecipePrice !== undefined" class="recipe-info-row">
                        <span class="recipe-info-label">Recipe Market Price:</span>
                        <span class="recipe-info-value">{{ formatNumber(potion.tradableRecipePrice) }} gold</span>
                      </div>
                      <div v-if="potion.recipeUses !== undefined" class="recipe-info-row">
                        <span class="recipe-info-label">Recipe Uses:</span>
                        <span class="recipe-info-value">{{ potion.recipeUses }}x</span>
                      </div>
                      <div v-if="potion.recipeCostPerCraft !== undefined" class="recipe-info-row">
                        <span class="recipe-info-label">Amortized Cost per Craft:</span>
                        <span class="recipe-info-value">{{ formatNumber(potion.recipeCostPerCraft) }} gold</span>
                      </div>
                      <hr class="recipe-divider">
                      <div class="recipe-info-row highlight">
                        <span class="recipe-info-label">Profit (with recipe cost):</span>
                        <span class="recipe-info-value">{{ formatNumber(potion.profit) }} gold</span>
                      </div>
                      <div class="recipe-info-row highlight">
                        <span class="recipe-info-label">Profit/hr (with recipe cost):</span>
                        <span class="recipe-info-value">{{ formatNumber(potion.profitPerHour) }} gold/hr</span>
                      </div>
                      <div v-if="potion.profitWithRecipeCost !== undefined" class="recipe-info-row highlight">
                        <span class="recipe-info-label">Profit (without recipe):</span>
                        <span class="recipe-info-value">{{ formatNumber(potion.profitWithRecipeCost) }} gold</span>
                      </div>
                      <div v-if="potion.profitPerHourWithRecipeCost !== undefined" class="recipe-info-row highlight">
                        <span class="recipe-info-label">Profit/hr (without recipe):</span>
                        <span class="recipe-info-value">{{ formatNumber(potion.profitPerHourWithRecipeCost) }} gold/hr</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.potion-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Sub-tab Navigation */
.sub-tab-navigation {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  flex-wrap: wrap;
}

.sub-tab-button {
  padding: 0.5rem 1rem;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.sub-tab-button:hover {
  background-color: var(--bg-primary);
}

.sub-tab-button.active {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.4);
}

/* Table Container */
.table-container {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

.main-table {
  width: 100%;
  border-collapse: collapse;
}

.main-table thead {
  background-color: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-color);
}

.main-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

.main-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}

.main-table th.sortable:hover {
  color: var(--text-primary);
}

.main-table th.text-right {
  text-align: right;
}

.main-table tbody tr.main-row {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.main-table tbody tr.main-row:hover {
  background-color: var(--bg-tertiary);
}

.main-table tbody tr.main-row.expanded {
  background-color: var(--bg-tertiary);
}

.main-table td {
  padding: 1rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.text-right {
  text-align: right;
}

/* Expand Column */
.expand-col {
  width: 3rem;
}

.expand-button {
  padding: 0.25rem 0.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.expand-button:hover {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.expand-button.expanded {
  background-color: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* Name Cell */
.name-cell {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-delete-potion {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, background-color 0.2s;
  margin-left: auto;
  flex-shrink: 0;
}

.main-row:hover .btn-delete-potion {
  opacity: 0.6;
}

.btn-delete-potion:hover {
  opacity: 1 !important;
  color: var(--error, #ef4444);
  background-color: rgba(239, 68, 68, 0.1);
}

/* Profit Cells */
.profit {
  color: var(--success);
  font-weight: 600;
}

.loss {
  color: var(--danger);
  font-weight: 600;
}

.profit-hr {
  font-weight: 700;
}

/* Expanded Row */
.expanded-row {
  background-color: var(--bg-primary);
}

.expanded-content {
  padding: 0 !important;
}

.material-breakdown {
  padding: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.breakdown-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* Material Table */
.material-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  overflow: hidden;
}

.material-table thead {
  background-color: var(--bg-tertiary);
}

.material-table th {
  padding: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  font-weight: 600;
}

.material-table th.text-right {
  text-align: right;
}

.material-table tbody tr {
  border-bottom: 1px solid var(--border-color);
}

.material-table tbody tr:hover {
  background-color: var(--bg-tertiary);
}

.material-table td {
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.subtotal {
  font-weight: 600;
  color: var(--text-accent);
}

/* Material Table Footer */
.material-table tfoot {
  background-color: var(--bg-tertiary);
  border-top: 2px solid var(--border-color);
}

.total-row {
  font-weight: 600;
}

.total-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.total-value {
  color: var(--warning);
  font-size: 1rem;
  font-weight: 700;
}

/* Responsive */
@media (max-width: 1200px) {
  .table-container {
    overflow-x: auto;
  }

  .main-table {
    min-width: 1000px;
  }
}

/* Mobile card layout overrides */
@media (max-width: 767px) {
  .table-container {
    overflow-x: visible !important;
    overflow-y: visible !important;
    width: 100%;
    max-width: 100%;
  }

  .main-table {
    min-width: 0 !important;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .main-table th,
  .main-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }

  .material-breakdown {
    padding: 1rem;
  }
}

/* Tooltip Styles */
.profit-with-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.recipe-indicator {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--accent-primary);
  cursor: help;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.recipe-indicator:hover {
  opacity: 1;
}

.tooltip {
  position: fixed;
  display: none;
  z-index: 9999;
  pointer-events: none;
}

.profit-with-tooltip:hover .tooltip {
  display: block;
}

.tooltip-content {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  min-width: 250px;
}

.tooltip-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.375rem 0;
  font-size: 0.875rem;
}

.tooltip-row.small {
  font-size: 0.75rem;
  opacity: 0.9;
}

.tooltip-label {
  color: var(--text-secondary);
}

.tooltip-value {
  color: var(--text-primary);
  font-weight: 500;
}

.tooltip-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 0.5rem 0;
}


/* Mobile: Hide tooltips on touch devices, show in expanded view instead */
@media (max-width: 767px) {
  .tooltip {
    display: none !important;
  }

  .recipe-indicator {
    font-size: 0.875rem;
  }
}

/* Recipe Cost Section (Expanded View) */
.craft-time-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.craft-time-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.craft-time-display {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.recipe-cost-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.recipe-info {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 1rem;
}

.recipe-info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.recipe-info-row.highlight {
  font-weight: 600;
  padding-top: 0.75rem;
}

.recipe-info-label {
  color: var(--text-secondary);
}

.recipe-info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.recipe-divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 0.75rem 0;
}
</style>
