<script setup lang="ts">
defineProps<{
  size?: 'small' | 'medium' | 'large'
  message?: string
}>()
</script>

<template>
  <div
    class="loading-spinner"
    :class="`spinner-${size || 'medium'}`"
    role="status"
    aria-live="polite"
  >
    <div class="spinner"></div>
    <p v-if="message" class="loading-message">{{ message }}</p>
    <span class="sr-only">Loading...</span>
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
