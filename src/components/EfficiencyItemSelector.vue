<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEfficiencyConfig } from '../composables/useEfficiencyConfig'
import { useDataProvider } from '../composables/useDataProvider'
import { formatSkillName } from '../utils/formatting'
import type { ResourceSkill, EfficiencyItem } from '../types'

const props = defineProps<{
  modelValue: boolean
  skill: ResourceSkill | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// Get data provider for efficiency items
const dataProvider = useDataProvider()

// Access the efficiency composable
const { equipItem, unequipItem, isItemEquipped } = useEfficiencyConfig(
  dataProvider.efficiencyItems
)

// Refs for focus management
// eslint-disable-next-line no-undef
const modalCloseButtonRef = ref<HTMLButtonElement | null>(null)
const modalContentRef = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

// Local selection state (radio selection)
const selectedItemName = ref<string | null>(null)

// Initialize selection when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.skill) {
      // Get currently equipped item for this skill
      const equippedItem = dataProvider.efficiencyItems.value.find((item) =>
        item.effects.some((effect) => effect.skill === props.skill && isItemEquipped(props.skill!, item.name))
      )
      selectedItemName.value = equippedItem?.name || null
    }
  }
)

// Get items that have effects for the current skill
const availableItems = computed(() => {
  if (!props.skill) return []

  return dataProvider.efficiencyItems.value.filter((item) =>
    item.effects.some((effect) => effect.skill === props.skill)
  )
})

// Get the efficiency percentage for an item
const getItemEfficiency = (item: EfficiencyItem): number => {
  if (!props.skill) return 0
  const effect = item.effects.find((e) => e.skill === props.skill)
  return effect?.efficiencyPercent ?? 0
}

// Handle radio selection
const selectItem = (itemName: string | null) => {
  selectedItemName.value = itemName
}

// Apply selection and close modal
const applySelection = () => {
  if (!props.skill) return

  if (selectedItemName.value) {
    equipItem(props.skill, selectedItemName.value)
  } else {
    unequipItem(props.skill)
  }

  closeModal()
}

// Clear selection
const clearSelection = () => {
  selectedItemName.value = null
}

// Close modal
const closeModal = () => {
  emit('update:modelValue', false)
  // Restore focus
  setTimeout(() => {
    previousFocus?.focus()
  }, 100)
}

// Focus trap
const getFocusableElements = (container: HTMLElement) => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ]
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

const handleModalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal()
    return
  }

  if (e.key !== 'Tab' || !modalContentRef.value) return

  const focusableElements = getFocusableElements(modalContentRef.value)
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault()
    lastElement.focus()
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault()
    firstElement.focus()
  }
}

// Set focus on open
const onOpen = () => {
  previousFocus = document.activeElement as HTMLElement
  setTimeout(() => {
    modalCloseButtonRef.value?.focus()
  }, 100)
}

// Watch for modal open
onMounted(() => {
  if (props.modelValue) {
    onOpen()
  }
})

// Current selection summary
const selectionSummary = computed(() => {
  if (!selectedItemName.value) return 'None selected'
  const item = availableItems.value.find((i) => i.name === selectedItemName.value)
  if (!item) return 'None selected'
  return `${item.name} (+${getItemEfficiency(item)}%)`
})
</script>

<template>
  <div
    v-if="modelValue"
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="`efficiency-selector-title-${skill}`"
    @click.self="closeModal"
  >
    <div ref="modalContentRef" class="modal-content" @keydown="handleModalKeydown">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2 :id="`efficiency-selector-title-${skill}`" class="modal-title">
            {{ formatSkillName(skill) }} Efficiency
          </h2>
          <div class="selection-badge">{{ selectionSummary }}</div>
        </div>
        <button
          ref="modalCloseButtonRef"
          class="btn-close"
          title="Close"
          :aria-label="`Close ${formatSkillName(skill)} efficiency selector`"
          @click="closeModal"
        >
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
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Action Button -->
      <div v-if="selectedItemName !== null" class="action-buttons">
        <button class="btn-action" @click="clearSelection">Clear Selection</button>
      </div>

      <!-- Item List -->
      <div class="item-list">
        <div v-if="availableItems.length === 0" class="empty-state">
          <p class="empty-message">No efficiency items available for {{ formatSkillName(skill) }}.</p>
          <p class="empty-hint">
            Efficiency items must be added to the defaults.json efficiencyItems array.
          </p>
        </div>

        <div v-else class="item-group">
          <!-- None option -->
          <label class="item-option" :class="{ selected: selectedItemName === null }">
            <input
              type="radio"
              name="efficiency-item"
              :checked="selectedItemName === null"
              :aria-label="`No ${formatSkillName(skill)} efficiency item`"
              @change="selectItem(null)"
            />
            <span class="radio-custom"></span>
            <div class="item-details">
              <span class="item-name">None</span>
              <span class="item-efficiency">No efficiency bonus</span>
            </div>
          </label>

          <!-- Available items -->
          <label
            v-for="item in availableItems"
            :key="item.name"
            class="item-option"
            :class="{ selected: selectedItemName === item.name }"
          >
            <input
              type="radio"
              name="efficiency-item"
              :checked="selectedItemName === item.name"
              :aria-label="`${item.name} (+${getItemEfficiency(item)}% efficiency)`"
              @change="selectItem(item.name)"
            />
            <span class="radio-custom"></span>
            <div class="item-details">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-efficiency">+{{ getItemEfficiency(item) }}% efficiency</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-summary">{{ selectionSummary }}</div>
        <button class="btn-done" @click="applySelection">Done</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal Overlay */
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
  will-change: opacity;
  contain: layout style paint;
  animation: fadeIn 0.2s var(--ease-out);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Content */
.modal-content {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  max-width: 480px;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  position: relative;
  will-change: transform, opacity;
  contain: layout style paint;
  animation: slideIn 0.3s var(--ease-out);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Modal Header */
.modal-header {
  position: sticky;
  top: 0;
  background-color: var(--bg-primary);
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  z-index: 10;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.selection-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: rgba(20, 184, 166, 0.15);
  color: var(--teal-400);
  border: 1px solid rgba(20, 184, 166, 0.3);
  border-radius: 0.75rem;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-close {
  padding: 0.5rem;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  flex-shrink: 0;
}

.btn-close:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border-color: var(--danger);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.btn-close:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.2);
}

.btn-close:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.btn-action {
  flex: 1;
  padding: 0.5rem 1rem;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  min-height: 36px;
}

.btn-action:hover {
  background-color: var(--bg-secondary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-action:active {
  transform: scale(0.98);
}

.btn-action:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Item List */
.item-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.item-group {
  display: flex;
  flex-direction: column;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
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

/* Item Option */
.item-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s var(--ease-out);
  min-height: 44px;
  user-select: none;
}

.item-option:last-child {
  border-bottom: none;
}

.item-option:hover {
  background-color: var(--bg-tertiary);
}

.item-option.selected {
  background-color: rgba(20, 184, 166, 0.08);
}

.item-option.selected:hover {
  background-color: rgba(20, 184, 166, 0.12);
}

/* Hide native radio */
.item-option input[type='radio'] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* Custom Radio */
.radio-custom {
  position: relative;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  background-color: var(--bg-tertiary);
  transition: all 0.2s var(--ease-out);
  flex-shrink: 0;
}

.item-option:hover .radio-custom {
  border-color: var(--teal-400);
}

.item-option input[type='radio']:checked + .radio-custom {
  background-color: var(--teal-400);
  border-color: var(--teal-400);
}

.item-option input[type='radio']:checked + .radio-custom::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
}

.item-option input[type='radio']:focus + .radio-custom {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Item Details */
.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.item-name {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

.item-efficiency {
  font-size: 0.75rem;
  color: var(--teal-400);
  font-weight: 500;
}

/* Modal Footer */
.modal-footer {
  position: sticky;
  bottom: 0;
  background-color: var(--bg-primary);
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.footer-summary {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-done {
  padding: 0.5rem 1.5rem;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  min-height: 36px;
  flex-shrink: 0;
}

.btn-done:hover {
  background-color: var(--accent-hover);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.btn-done:active {
  transform: scale(0.98);
}

.btn-done:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Mobile Responsive */
@media (max-width: 379px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
    background-color: rgba(0, 0, 0, 0.85);
  }

  .modal-content {
    max-height: 92vh;
    border-radius: 1.25rem 1.25rem 0 0;
    width: 100%;
    max-width: 100%;
    animation: slideUp 0.3s var(--ease-out);
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .modal-header::before {
    content: '';
    position: absolute;
    top: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 2.5rem;
    height: 0.25rem;
    background-color: var(--border-color);
    border-radius: 0.125rem;
  }

  .modal-title {
    font-size: 1.125rem;
  }

  .btn-close {
    min-width: 48px;
    min-height: 48px;
    padding: 0.75rem;
  }

  .action-buttons {
    padding: 0.75rem 1rem;
  }

  .item-option {
    padding: 0.75rem 1rem;
    min-height: 48px;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
  }
}
</style>
