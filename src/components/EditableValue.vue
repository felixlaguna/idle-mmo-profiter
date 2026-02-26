<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: number
  defaultValue: number
  label?: string
  suffix?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const isEditing = ref(false)
const editValue = ref(props.modelValue.toString())

const isOverridden = computed(() => props.modelValue !== props.defaultValue)

const displayValue = computed(() => {
  const value = props.modelValue.toLocaleString()
  return props.suffix ? `${value}${props.suffix}` : value
})

// Update editValue when modelValue changes externally
watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEditing.value) {
      editValue.value = newValue.toString()
    }
  }
)

const startEdit = () => {
  isEditing.value = true
  editValue.value = props.modelValue.toString()
  // Focus input on next tick
  setTimeout(() => {
    const input = document.querySelector('.editable-value input') as HTMLInputElement
    input?.focus()
    input?.select()
  }, 0)
}

const saveEdit = () => {
  const parsed = parseFloat(editValue.value)
  if (!isNaN(parsed) && parsed >= 0) {
    emit('update:modelValue', parsed)
    isEditing.value = false
  } else {
    alert('Please enter a valid positive number')
    editValue.value = props.modelValue.toString()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editValue.value = props.modelValue.toString()
}

const resetToDefault = () => {
  if (confirm(`Reset to default value (${props.defaultValue})?`)) {
    emit('update:modelValue', props.defaultValue)
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    saveEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}
</script>

<template>
  <div class="editable-value" :class="{ overridden: isOverridden }">
    <span v-if="label" class="label">{{ label }}:</span>
    <div v-if="!isEditing" class="display-mode" @click="startEdit">
      <span class="value">{{ displayValue }}</span>
      <span class="edit-hint">✏️</span>
    </div>
    <div v-else class="edit-mode">
      <input
        v-model="editValue"
        type="number"
        step="any"
        min="0"
        class="edit-input"
        @keydown="handleKeydown"
        @blur="saveEdit"
      />
      <span v-if="suffix" class="suffix">{{ suffix }}</span>
    </div>
    <button
      v-if="isOverridden && !isEditing"
      class="btn-reset"
      title="Reset to default"
      @click.stop="resetToDefault"
    >
      ↺
    </button>
  </div>
</template>

<style scoped>
.editable-value {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.editable-value.overridden {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.display-mode {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.display-mode:hover {
  background-color: var(--bg-tertiary);
}

.value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.overridden .value {
  color: var(--text-accent);
}

.edit-hint {
  opacity: 0;
  font-size: 0.75rem;
  transition: opacity 0.2s;
}

.display-mode:hover .edit-hint {
  opacity: 0.5;
}

.edit-mode {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.edit-input {
  width: 8rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid var(--accent-primary);
  border-radius: 0.25rem;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.edit-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.suffix {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn-reset {
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

/* Remove number input arrows */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}

/* Mobile optimizations - reduce size in card layout */
@media (max-width: 767px) {
  .editable-value {
    padding: 0;
    gap: 0.25rem;
    max-width: 100%;
    justify-content: flex-end;
  }

  .value {
    font-size: 0.75rem;
  }

  .edit-input {
    width: 6rem;
    font-size: 0.75rem;
  }
}
</style>
