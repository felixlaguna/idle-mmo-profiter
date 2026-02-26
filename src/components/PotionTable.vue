<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PotionProfitResult } from '../calculators/potionCalculator'
import EditableValue from './EditableValue.vue'
import { useHeatmap } from '../composables/useHeatmap'

const { getHeatmapStyle } = useHeatmap()

const props = defineProps<{
  potions: PotionProfitResult[]
}>()

// Emit events for editing values
const emit = defineEmits<{
  (e: 'update:materialPrice', potionName: string, materialName: string, value: number): void
  (e: 'update:vialCost', potionName: string, value: number): void
  (e: 'update:marketPrice', potionName: string, value: number): void
}>()

// Expanded rows tracking
const expandedRows = ref<Set<string>>(new Set())

// Sort configuration
type SortKey = 'name' | 'materialCost' | 'vialCost' | 'totalCost' | 'currentPrice' | 'profit' | 'profitPerHour'
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
      case 'materialCost':
        aValue = a.totalCost - a.vialCost
        bValue = b.totalCost - b.vialCost
        break
      case 'vialCost':
        aValue = a.vialCost
        bValue = b.vialCost
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

// Calculate profit range for heatmap
const profitRange = computed(() => {
  const profits = props.potions.map(p => p.profit)
  const profitHours = props.potions.map(p => p.profitPerHour)
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

// Calculate total material cost
const getMaterialCost = (potion: PotionProfitResult): number => {
  return potion.totalCost - potion.vialCost
}

// Handle inline editing
const handleMaterialPriceUpdate = (potionName: string, materialName: string, value: number) => {
  emit('update:materialPrice', potionName, materialName, value)
}

const handleVialCostUpdate = (potionName: string, value: number) => {
  emit('update:vialCost', potionName, value)
}

const handleMarketPriceUpdate = (potionName: string, value: number) => {
  emit('update:marketPrice', potionName, value)
}
</script>

<template>
  <div class="potion-table">
    <div class="table-container">
      <table class="main-table mobile-card-layout" role="grid" aria-label="Potion crafting profitability">
        <thead>
          <tr>
            <th class="expand-col"></th>
            <th class="sortable" @click="toggleSort('name')">
              Potion Name {{ getSortIcon('name') }}
            </th>
            <th class="sortable text-right" @click="toggleSort('materialCost')">
              Material Cost {{ getSortIcon('materialCost') }}
            </th>
            <th class="sortable text-right" @click="toggleSort('vialCost')">
              Vial Cost {{ getSortIcon('vialCost') }}
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
          <template v-for="potion in sortedPotions" :key="potion.name">
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
              <td class="name-cell" data-label="Potion">{{ potion.name }}</td>
              <td class="text-right" data-label="Material Cost">{{ formatNumber(getMaterialCost(potion)) }}</td>
              <td class="text-right" data-label="Vial Cost">
                <EditableValue
                  :model-value="potion.vialCost"
                  :default-value="potion.vialCost"
                  @update:model-value="(value) => handleVialCostUpdate(potion.name, value)"
                />
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
                {{ formatNumber(potion.profit) }}
              </td>
              <td
                class="text-right profit-hr"
                data-label="Profit/hr"
                :style="getHeatmapStyle(potion.profitPerHour, profitRange.profitPerHour.min, profitRange.profitPerHour.max)"
              >
                {{ formatNumber(potion.profitPerHour) }}
              </td>
            </tr>

            <!-- Expanded Row: Material Breakdown -->
            <tr v-if="isExpanded(potion.name)" class="expanded-row">
              <td colspan="8" class="expanded-content">
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
                        <td colspan="3" class="text-right total-label">Total Material Cost:</td>
                        <td class="text-right total-value">{{ formatNumber(getMaterialCost(potion)) }}</td>
                      </tr>
                    </tfoot>
                  </table>
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
</style>
