<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  console.error('Error caught by boundary:', err)
  return false // Prevent error from propagating
})

const reset = () => {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div v-if="hasError" class="error-boundary" role="alert" aria-live="assertive">
    <div class="error-icon">⚠</div>
    <h2 class="error-title">Something went wrong</h2>
    <p class="error-message">{{ errorMessage }}</p>
    <button class="error-action" @click="reset">Try Again</button>
  </div>
  <slot v-else></slot>
</template>

<style scoped>
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  background-color: var(--bg-secondary);
  border: 2px solid var(--danger);
  border-radius: 0.5rem;
  min-height: 300px;
}

.error-icon {
  font-size: 3rem;
  color: var(--danger);
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  max-width: 500px;
  line-height: 1.5;
  font-family: monospace;
  background-color: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 0.375rem;
}

.error-action {
  padding: 0.625rem 1.25rem;
  background-color: var(--danger);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-action:hover {
  opacity: 0.9;
}
</style>
