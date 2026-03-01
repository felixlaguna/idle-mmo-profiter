<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  size?: 'small' | 'medium' | 'large'
  message?: string
  timeout?: number // Optional timeout in milliseconds
}>()

const emit = defineEmits<{
  (e: 'timeout'): void
}>()

const hasTimedOut = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (props.timeout && props.timeout > 0) {
    timeoutId = setTimeout(() => {
      hasTimedOut.value = true
      emit('timeout')
    }, props.timeout)
  }
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

<template>
  <div
    class="loading-spinner"
    :class="[`spinner-${size || 'medium'}`, { 'has-timed-out': hasTimedOut }]"
    role="status"
    aria-live="polite"
  >
    <div v-if="!hasTimedOut" class="spinner"></div>
    <div v-else class="timeout-icon">⏱️</div>
    <p v-if="!hasTimedOut && message" class="loading-message">{{ message }}</p>
    <p v-else-if="hasTimedOut" class="timeout-message">This is taking longer than expected...</p>
    <span class="sr-only">{{ hasTimedOut ? 'Loading timed out' : 'Loading...' }}</span>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small .spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.spinner-medium .spinner {
  width: 3rem;
  height: 3rem;
  border-width: 3px;
}

.spinner-large .spinner {
  width: 4rem;
  height: 4rem;
  border-width: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.timeout-icon {
  font-size: 3rem;
  opacity: 0.5;
  animation: pulse 2s ease-in-out infinite;
}

.timeout-message {
  color: var(--warning);
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

.has-timed-out {
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
