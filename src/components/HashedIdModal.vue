<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'

interface Props {
  visible: boolean
  itemName: string
  itemId: string
  category: 'materials' | 'craftables' | 'resources' | 'recipes'
  currentHashedId: string
  refreshing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  refreshing: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [hashedId: string]
  refresh: []
}>()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const modalRef = ref<HTMLElement | null>(null)

// Focus trap state
let previousActiveElement: HTMLElement | null = null

// Get all focusable elements within the modal
const getFocusableElements = () => {
  if (!modalRef.value) return []
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]
  return Array.from(
    modalRef.value.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
  ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

// Trap focus within modal
const handleModalKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Tab') return

  const focusableElements = getFocusableElements()
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

// Watch for modal visibility to reset input and auto-focus
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      previousActiveElement = document.activeElement as HTMLElement
      inputValue.value = props.currentHashedId || ''
      nextTick(() => {
        inputRef.value?.focus()
      })
    } else {
      // Restore focus when modal closes
      if (previousActiveElement) {
        previousActiveElement.focus()
        previousActiveElement = null
      }
    }
  }
)

// Watch for prop changes while modal is open (in case item is refreshed)
watch(
  () => props.currentHashedId,
  (newHashedId) => {
    if (props.visible) {
      inputValue.value = newHashedId || ''
    }
  }
)

const trimmedValue = computed(() => inputValue.value.trim())
const isValueChanged = computed(() => trimmedValue.value !== (props.currentHashedId || ''))
const hasCurrentHashedId = computed(() => (props.currentHashedId || '') !== '')

function close() {
  emit('update:visible', false)
}

function save() {
  if (!isValueChanged.value) {
    // No-op: value hasn't changed, just close
    close()
    return
  }
  emit('save', trimmedValue.value)
  close()
}

function clear() {
  inputValue.value = ''
  emit('save', '')
  close()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    save()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function refreshItemData() {
  emit('refresh')
}

// Auto-focus on mount if visible
onMounted(() => {
  if (props.visible) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<template>
  <div
    v-if="visible"
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="hashed-id-modal-title"
    @click.self="close"
    @keydown="handleKeydown"
  >
    <div ref="modalRef" class="modal-content-small" @keydown="handleModalKeydown">
      <div class="modal-header-small">
        <h3 id="hashed-id-modal-title">Hashed ID - {{ itemName }}</h3>
        <button class="btn-close-modal" aria-label="Close modal" @click="close">
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
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="hashed-id-input" class="form-label">Hashed ID</label>
          <input
            id="hashed-id-input"
            ref="inputRef"
            v-model="inputValue"
            type="text"
            class="form-input"
            autocomplete="off"
            :placeholder="hasCurrentHashedId ? currentHashedId : 'Not set'"
            @keydown="handleKeydown"
          />
          <p v-if="!hasCurrentHashedId" class="form-hint muted">No hashed ID set for this item</p>
          <p class="form-hint warning">
            Warning: Incorrect hashed IDs will cause wrong price lookups from the API
          </p>
        </div>
        <hr class="separator" />
        <div class="refresh-section">
          <button
            class="btn-refresh-data"
            :disabled="!hasCurrentHashedId || refreshing"
            :title="
              !hasCurrentHashedId
                ? 'Set a hashed ID first'
                : refreshing
                  ? 'Refreshing...'
                  : 'Fetch latest data from API (uses, producesItemName, vendor price)'
            "
            @click="refreshItemData"
          >
            <span v-if="refreshing" class="spinner-inline"></span>
            <svg
              v-else
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
            {{ refreshing ? 'Refreshing...' : 'Refresh Item Data' }}
          </button>
        </div>
        <div class="modal-actions">
          <button
            class="btn-save"
            :disabled="!isValueChanged"
            aria-label="Save hashed ID changes"
            @click="save"
          >
            Save
          </button>
          <button class="btn-cancel" aria-label="Cancel and close modal" @click="close">
            Cancel
          </button>
          <button
            v-if="hasCurrentHashedId"
            class="btn-clear"
            aria-label="Clear hashed ID"
            @click="clear"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-input::placeholder {
  color: var(--text-secondary);
}

.form-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.form-hint.muted {
  color: var(--text-secondary);
}

.form-hint.warning {
  color: var(--warning);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-save {
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

.btn-save:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
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

.btn-cancel:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-clear {
  padding: 0.75rem 1rem;
  background-color: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Responsive Design */
@media (max-width: 767px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content-small {
    max-width: 100%;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-cancel,
  .btn-clear {
    width: 100%;
  }

  .form-input {
    font-size: 16px; /* Prevent zoom on iOS */
    min-height: 44px; /* Finger-friendly touch target */
  }
}

.separator {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1rem 0;
}

.refresh-section {
  margin-bottom: 1.5rem;
}

.btn-refresh-data {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-secondary, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-refresh-data:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-refresh-data:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
