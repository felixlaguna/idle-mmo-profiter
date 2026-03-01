<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')
const retryCount = ref(0)
const maxRetries = 3

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  errorStack.value = err instanceof Error ? err.stack || '' : ''
  console.error('Error caught by boundary:', err)
  return false // Prevent error from propagating
})

const reset = () => {
  if (retryCount.value < maxRetries) {
    retryCount.value++
    hasError.value = false
    errorMessage.value = ''
    errorStack.value = ''
  }
}

const hardReset = () => {
  retryCount.value = 0
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
}

// Get user-friendly error message
const friendlyMessage = () => {
  const msg = errorMessage.value.toLowerCase()

  if (msg.includes('network') || msg.includes('fetch failed')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }

  if (msg.includes('timeout')) {
    return 'The request took too long to complete. Please try again.'
  }

  if (msg.includes('not found') || msg.includes('404')) {
    return 'The requested resource could not be found. Please try again later.'
  }

  if (msg.includes('unauthorized') || msg.includes('401')) {
    return 'Authentication failed. Please check your API key in settings.'
  }

  if (msg.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  return 'An unexpected error occurred. Please try again.'
}

const canRetry = () => retryCount.value < maxRetries
</script>

<template>
  <div v-if="hasError" class="error-boundary" role="alert" aria-live="assertive">
    <div class="error-icon">⚠</div>
    <h2 class="error-title">Something went wrong</h2>
    <p class="error-friendly">{{ friendlyMessage() }}</p>
    <details class="error-details">
      <summary class="error-details-toggle">Technical details</summary>
      <p class="error-message">{{ errorMessage }}</p>
      <pre v-if="errorStack" class="error-stack">{{ errorStack }}</pre>
    </details>
    <div class="error-actions">
      <button v-if="canRetry()" class="error-action error-action-primary" @click="reset">
        Try Again
        <span v-if="retryCount > 0" class="retry-count">({{ retryCount }}/{{ maxRetries }})</span>
      </button>
      <button class="error-action error-action-secondary" @click="hardReset">Reset</button>
    </div>
    <p v-if="!canRetry()" class="error-hint">
      Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
    </p>
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

.error-friendly {
  font-size: 0.9375rem;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  max-width: 500px;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 1.5rem;
  max-width: 600px;
  width: 100%;
}

.error-details-toggle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.error-details-toggle:hover {
  color: var(--text-primary);
}

.error-message {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0.75rem 0 0 0;
  max-width: 600px;
  line-height: 1.5;
  font-family: monospace;
  background-color: var(--bg-tertiary);
  padding: 0.75rem;
  border-radius: 0.375rem;
  word-break: break-word;
}

.error-stack {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
  max-width: 600px;
  line-height: 1.4;
  font-family: monospace;
  background-color: var(--bg-tertiary);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.error-action {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.error-action-primary {
  background-color: var(--danger);
  color: white;
}

.error-action-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.error-action-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.error-action-secondary:hover {
  background-color: var(--bg-secondary);
  border-color: var(--accent-primary);
}

.retry-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.error-hint {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 1rem 0 0 0;
  max-width: 500px;
  line-height: 1.5;
}
</style>
