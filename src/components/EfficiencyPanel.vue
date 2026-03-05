<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEfficiencyConfig } from '../composables/useEfficiencyConfig'
import { useDataProvider } from '../composables/useDataProvider'
import { formatSkillName } from '../utils/formatting'
import type { ResourceSkill } from '../types'

// Get data provider for efficiency items and resource skill map
const dataProvider = useDataProvider()

// Initialize efficiency config composable
const { equippedItems, getEfficiency } = useEfficiencyConfig(dataProvider.efficiencyItems)

// Local state for collapse/expand
const isExpanded = ref(false)

// Emit event when skill selector button is clicked
const emit = defineEmits<{
  (e: 'open-skill-selector', skill: ResourceSkill): void
}>()

// Toggle collapse state
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Handle keyboard navigation for summary row
const handleSummaryKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleExpanded()
  }
}

// Handle skill selector button click
const openSkillSelector = (skill: ResourceSkill, event: Event) => {
  event.stopPropagation()
  emit('open-skill-selector', skill)
}

// Get list of skills that have efficiency items available
const activeSkills = computed(() => {
  const skills = new Set<ResourceSkill>()
  dataProvider.efficiencyItems.value.forEach((item) => {
    item.effects.forEach((effect) => {
      skills.add(effect.skill)
    })
  })
  return [...skills]
})

// Computed summary for collapse row
const efficiencySummary = computed(() => {
  if (equippedItems.value.length === 0) {
    return 'No efficiency items equipped'
  }

  const parts = equippedItems.value
    .map(([skill]) => {
      const efficiency = getEfficiency(skill)
      const skillName = skill.charAt(0).toUpperCase() + skill.slice(1)
      return `${skillName} ${efficiency}%`
    })
    .join(' | ')

  return parts
})

// Total efficiency across all skills (for display purposes)
const totalEfficiencyBonus = computed(() => {
  return equippedItems.value.reduce((sum, [skill]) => {
    return sum + getEfficiency(skill)
  }, 0)
})
</script>

<template>
  <div class="efficiency-panel">
    <!-- Summary row (always visible) -->
    <div
      class="summary-row"
      tabindex="0"
      role="button"
      :aria-label="isExpanded ? 'Collapse Efficiency settings' : 'Expand Efficiency settings'"
      @click="toggleExpanded"
      @keydown="handleSummaryKeydown"
    >
      <div class="summary-left">
        <span class="summary-label">Efficiency:</span>
        <span class="summary-value" :class="{ empty: equippedItems.length === 0 }">{{ efficiencySummary }}</span>
      </div>

      <div class="summary-right">
        <button
          class="chevron-button"
          :class="{ expanded: isExpanded }"
          :aria-label="isExpanded ? 'Collapse Efficiency settings' : 'Expand Efficiency settings'"
          :aria-expanded="isExpanded"
        >
          <svg
            class="chevron-icon"
            :class="{ expanded: isExpanded }"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="20"
            height="20"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Collapsible card -->
    <div v-show="isExpanded" class="collapsible-card">
      <div v-if="activeSkills.length === 0" class="empty-state">
        <p class="empty-message">No resource recipes added yet.</p>
        <p class="empty-hint">Add resource recipes to configure efficiency items.</p>
      </div>

      <div v-else class="skills-grid">
        <div v-for="skill in activeSkills" :key="skill" class="skill-row">
          <div class="skill-info">
            <span class="skill-name">{{ formatSkillName(skill) }}</span>
            <span class="skill-efficiency">+{{ getEfficiency(skill) }}%</span>
          </div>
          <button
            class="skill-button"
            :title="`Configure ${formatSkillName(skill)} efficiency item`"
            @click="openSkillSelector(skill, $event)"
          >
            <span class="button-label">
              {{
                equippedItems.find(([s]) => s === skill)?.[1] ||
                `Select ${formatSkillName(skill)} Item`
              }}
            </span>
            <svg
              class="button-icon"
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="activeSkills.length > 0" class="total-summary">
        Total Efficiency Bonus: +{{ totalEfficiencyBonus }}%
      </div>
    </div>
  </div>
</template>

<style scoped>
.efficiency-panel {
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  border-radius: var(--surface-radius);
  box-shadow: var(--surface-shadow);
  margin-bottom: 1rem;
  overflow: hidden;
}

/* Summary row */
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-out);
  min-height: 44px;
}

.summary-row:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
}

.summary-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-value.empty {
  color: var(--text-tertiary);
  font-weight: 400;
}

.summary-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Chevron button */
.chevron-button {
  padding: 0;
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chevron-button:hover {
  color: var(--text-primary);
}

.chevron-icon {
  transition: transform 0.2s var(--ease-out);
  transform: rotate(-90deg);
}

.chevron-icon.expanded {
  transform: rotate(0deg);
}

/* Collapsible card */
.collapsible-card {
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--surface-border);
  animation: expandCard 0.2s var(--ease-out);
}

@keyframes expandCard {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.empty-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* Skills grid */
.skills-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 0.75rem;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  transition: background-color 0.2s var(--ease-out);
}

.skill-row:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.skill-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skill-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.skill-efficiency {
  font-size: 0.75rem;
  color: var(--accent-primary);
  font-weight: 600;
}

/* Skill button */
.skill-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  min-height: 44px;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%);
  color: var(--teal-400);
  border: 1px solid rgba(20, 184, 166, 0.3);
  border-radius: 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  white-space: nowrap;
  max-width: 100%;
}

.skill-button:hover {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.25) 0%, rgba(13, 148, 136, 0.25) 100%);
  border-color: var(--teal-400);
  transform: translateY(-1px);
}

.skill-button:active {
  transform: translateY(0);
}

.button-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.button-icon {
  flex-shrink: 0;
}

/* Total summary */
.total-summary {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 0.625rem;
  margin-top: 0.75rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  font-family: 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .summary-row {
    padding: 0.625rem 0.75rem;
  }

  .summary-label {
    font-size: 0.8125rem;
  }

  .summary-value {
    font-size: 0.8125rem;
  }

  .chevron-button {
    min-width: 48px;
    min-height: 48px;
    width: 48px;
    height: 48px;
  }

  .collapsible-card {
    padding: 0.75rem;
  }

  .skill-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .skill-button {
    width: 100%;
    justify-content: space-between;
    min-height: 48px;
  }

  .total-summary {
    font-size: 0.6875rem;
    padding: 0.5rem;
  }
}

/* Tablet responsive */
@media (min-width: 768px) and (max-width: 1023px) {
  .skill-button {
    font-size: 0.75rem;
    padding: 0.5rem 0.875rem;
  }
}
</style>
