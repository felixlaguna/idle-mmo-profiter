<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStorage } from '../composables/useStorage'

const apiKey = useStorage<string | null>('apiKey', null)
const inputValue = ref(apiKey.value || '')
const showKey = ref(false)

const hasApiKey = computed(() => apiKey.value !== null && apiKey.value !== '')
const statusText = computed(() => (hasApiKey.value ? 'API key saved' : 'No API key'))

const inputType = computed(() => (showKey.value ? 'text' : 'password'))

const saveApiKey = () => {
  if (inputValue.value.trim()) {
    apiKey.value = inputValue.value.trim()
    alert('API key saved successfully!')
  } else {
    alert('Please enter a valid API key')
  }
}

const clearApiKey = () => {
  if (confirm('Are you sure you want to clear your API key?')) {
    apiKey.value = null
    inputValue.value = ''
  }
}

const toggleShowKey = () => {
  showKey.value = !showKey.value
}
</script>

<template>
  <div class="api-key-input">
    <div class="header">
      <h3>API Key</h3>
      <span class="status" :class="{ active: hasApiKey }">{{ statusText }}</span>
    </div>
    <div class="input-row">
      <input
        v-model="inputValue"
        :type="inputType"
        placeholder="Enter your IdleMMO API key"
        class="key-input"
      />
      <button class="btn-toggle" :title="showKey ? 'Hide key' : 'Show key'" @click="toggleShowKey">
        {{ showKey ? '👁️' : '🔒' }}
      </button>
    </div>
    <div class="actions">
      <button class="btn-save" @click="saveApiKey">Save</button>
      <button class="btn-clear" :disabled="!hasApiKey" @click="clearApiKey">Clear</button>
    </div>
  </div>
</template>

<style scoped>
.api-key-input {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.status.active {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.input-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.key-input {
  flex: 1;
  min-width: 0;
}

.btn-toggle {
  width: 2.5rem;
  padding: 0.5rem;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-toggle:hover {
  background-color: var(--bg-primary);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-save,
.btn-clear {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background-color: var(--accent-primary);
  color: white;
  border: none;
}

.btn-save:hover {
  background-color: var(--accent-hover);
}

.btn-clear {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-clear:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
