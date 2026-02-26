<template>
  <div class="data-provider-status">
    <div :class="['status-badge', statusClass]">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-text">{{ status.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDataProviderStatus } from '../api/mock'

// Reactive status
const status = ref(getDataProviderStatus())

// Computed class for styling based on status
const statusClass = computed(() => {
  if (status.value.isUsingApi) {
    return 'status-api'
  }
  return 'status-default'
})

// Computed icon based on status
const statusIcon = computed(() => {
  if (status.value.isUsingApi) {
    return '🔄' // Live API
  }
  return '📋' // Default data
})

// Update status periodically
let intervalId: number | null = null

onMounted(() => {
  // Update status every 30 seconds
  intervalId = window.setInterval(() => {
    status.value = getDataProviderStatus()
  }, 30000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.data-provider-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.status-icon {
  font-size: 1rem;
}

.status-text {
  white-space: nowrap;
}

.status-api {
  background-color: var(--success);
  color: white;
}

.status-default {
  background-color: var(--text-secondary);
  color: white;
}
</style>
