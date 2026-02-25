<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataProvider } from './composables/useDataProvider'
import { useProfitRanking } from './composables/useProfitRanking'
import { useStorage } from './composables/useStorage'
import { calculateDungeonProfits } from './calculators/dungeonCalculator'
import { calculatePotionProfits } from './calculators/potionCalculator'
import { calculateResourceProfits } from './calculators/resourceCalculator'
import SettingsPanel from './components/SettingsPanel.vue'
import ProfitRankingTable from './components/ProfitRankingTable.vue'
import DungeonTable from './components/DungeonTable.vue'
import PotionTable from './components/PotionTable.vue'
import ResourceTable from './components/ResourceTable.vue'
import type { MagicFindSettings } from './types'

// Current tab state
type Tab = 'all' | 'dungeons' | 'potions' | 'resources'
const currentTab = ref<Tab>('all')

// Settings modal state
const showSettings = ref(false)

// Get data from data provider
const dataProvider = useDataProvider()

// Get settings from storage
const magicFind = useStorage<MagicFindSettings>('magicFind', {
  streak: 10,
  dungeon: 13,
  item: 3,
  bonus: 10,
})
const marketTaxRate = useStorage<number>('marketTaxRate', 0.12)

// Calculate profit rankings
const { rankedActivities, bestAction } = useProfitRanking({
  dungeons: dataProvider.dungeons,
  recipes: dataProvider.recipes,
  potionCrafts: dataProvider.potionCrafts,
  resourceGathering: dataProvider.resourceGathering,
  magicFind: computed(() => magicFind.value),
  taxRate: computed(() => marketTaxRate.value),
})

// Calculate dungeon profits for dungeon table
const dungeonProfits = computed(() => {
  return calculateDungeonProfits(
    dataProvider.dungeons.value,
    dataProvider.recipes.value,
    magicFind.value
  )
})

// Calculate potion profits for potion table
const potionProfits = computed(() => {
  return calculatePotionProfits(
    dataProvider.potionCrafts.value,
    marketTaxRate.value
  )
})

// Calculate resource profits for resource table
const resourceProfits = computed(() => {
  return calculateResourceProfits(
    dataProvider.resourceGathering.value,
    marketTaxRate.value
  )
})

// Last update time (placeholder - will be updated when API is integrated)
const lastUpdateTime = ref<Date | null>(null)

// Format numbers with commas
const formatNumber = (num: number): string => {
  return Math.round(num).toLocaleString()
}

// Format time
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (remainingSeconds === 0) {
    return `${minutes}m`
  }
  return `${minutes}m ${remainingSeconds}s`
}

// Get last update text
const lastUpdateText = computed(() => {
  if (!lastUpdateTime.value) {
    return 'Using default data'
  }
  return `Last updated: ${lastUpdateTime.value.toLocaleTimeString()}`
})

// Get type badge color
const getTypeBadgeClass = (type: string): string => {
  switch (type) {
    case 'dungeon':
      return 'badge-dungeon'
    case 'potion':
      return 'badge-potion'
    case 'resource':
      return 'badge-resource'
    default:
      return ''
  }
}
</script>

<template>
  <div class="app-container">
    <!-- Top Bar -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">IdleMMO Profit Calculator</h1>
        <div class="header-actions">
          <span class="last-update">{{ lastUpdateText }}</span>
          <button class="btn-settings" title="Settings" @click="showSettings = true">
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
              <circle cx="12" cy="12" r="3"></circle>
              <path
                d="M12 1v6m0 6v6m0-6h6m-6 0H6m12.364-6.364l-4.243 4.243m0 0l-4.243 4.243m4.243-4.243l4.243 4.243m-4.243-4.243l-4.243-4.243"
              ></path>
              <path
                d="M19.071 4.929a10 10 0 0 1 0 14.142m-14.142 0a10 10 0 0 1 0-14.142"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <div class="content-wrapper">
        <!-- Hero Section: Best Action -->
        <section v-if="bestAction" class="hero-section">
          <div class="hero-content">
            <div class="hero-label">Best Action Right Now</div>
            <div class="hero-activity">
              <h2 class="hero-name">{{ bestAction.name }}</h2>
              <span class="hero-badge" :class="getTypeBadgeClass(bestAction.activityType)">
                {{ bestAction.activityType }}
              </span>
            </div>
            <div class="hero-profit">
              <span class="hero-profit-value">{{ formatNumber(bestAction.profitPerHour) }}</span>
              <span class="hero-profit-label">gold/hr</span>
            </div>
            <div class="hero-details">
              <div class="hero-detail">
                <span class="detail-label">Profit per action</span>
                <span class="detail-value">{{ formatNumber(bestAction.profitPerAction) }} gold</span>
              </div>
              <div class="hero-detail">
                <span class="detail-label">Time per action</span>
                <span class="detail-value">{{ formatTime(bestAction.timePerAction) }}</span>
              </div>
              <div class="hero-detail">
                <span class="detail-label">Cost</span>
                <span class="detail-value">{{ formatNumber(bestAction.cost) }} gold</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Tab Navigation -->
        <nav class="tab-navigation">
          <button
            class="tab-button"
            :class="{ active: currentTab === 'all' }"
            @click="currentTab = 'all'"
          >
            All Activities
          </button>
          <button
            class="tab-button"
            :class="{ active: currentTab === 'dungeons' }"
            @click="currentTab = 'dungeons'"
          >
            Dungeons
          </button>
          <button
            class="tab-button"
            :class="{ active: currentTab === 'potions' }"
            @click="currentTab = 'potions'"
          >
            Potions
          </button>
          <button
            class="tab-button"
            :class="{ active: currentTab === 'resources' }"
            @click="currentTab = 'resources'"
          >
            Resources
          </button>
        </nav>

        <!-- Tab Content -->
        <div class="tab-content">
          <div v-if="currentTab === 'all'">
            <ProfitRankingTable :activities="rankedActivities" />
          </div>
          <div v-if="currentTab === 'dungeons'">
            <DungeonTable :dungeons="dungeonProfits" />
          </div>
          <div v-if="currentTab === 'potions'">
            <PotionTable :potions="potionProfits" />
          </div>
          <div v-if="currentTab === 'resources'">
            <ResourceTable :resources="resourceProfits" />
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-content">
        <div class="modal-header">
          <button class="btn-close" title="Close" @click="showSettings = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
        <SettingsPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.app-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.last-update {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-settings {
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

.btn-settings:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

/* Main Content */
.app-main {
  flex: 1;
  padding: 2rem;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--warning);
  font-weight: 600;
}

.hero-activity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-name {
  font-size: 2rem;
  color: var(--text-primary);
  font-weight: 700;
  margin: 0;
}

.hero-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-dungeon {
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.badge-potion {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.badge-resource {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.hero-profit {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.hero-profit-value {
  font-size: 3rem;
  font-weight: 800;
  color: var(--warning);
  line-height: 1;
}

.hero-profit-label {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.hero-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.hero-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.tab-button {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.tab-button.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

/* Tab Content */
.tab-content {
  min-height: 400px;
}

.content-placeholder {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 3rem;
  text-align: center;
}

.content-placeholder h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.content-placeholder p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 0.5rem;
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

.modal-content {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  position: sticky;
  top: 0;
  background-color: var(--bg-primary);
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  z-index: 10;
}

.btn-close {
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

.btn-close:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--danger);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .app-title {
    font-size: 1.25rem;
  }

  .hero-section {
    padding: 1.5rem;
  }

  .hero-name {
    font-size: 1.5rem;
  }

  .hero-profit-value {
    font-size: 2rem;
  }

  .tab-navigation {
    overflow-x: auto;
  }

  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
