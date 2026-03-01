<script setup lang="ts">
import { watch } from 'vue'

export interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const props = defineProps<{
  messages: ToastMessage[]
}>()

const emit = defineEmits<{
  (e: 'dismiss', id: number): void
}>()

// Auto-dismiss toasts after duration
watch(
  () => props.messages,
  (newMessages) => {
    newMessages.forEach((toast) => {
      const duration = toast.duration || 3000
      setTimeout(() => {
        emit('dismiss', toast.id)
      }, duration)
    })
  },
  { deep: true }
)

const getTypeClass = (type: string): string => {
  switch (type) {
    case 'success':
      return 'toast-success'
    case 'error':
      return 'toast-error'
    case 'warning':
      return 'toast-warning'
    case 'info':
    default:
      return 'toast-info'
  }
}

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'ⓘ'
  }
}
</script>

<template>
  <div class="toast-container" role="region" aria-label="Notifications">
    <div
      v-for="toast in messages"
      :key="toast.id"
      class="toast"
      :class="getTypeClass(toast.type)"
      role="alert"
      aria-live="polite"
    >
      <span class="toast-icon">{{ getTypeIcon(toast.type) }}</span>
      <span class="toast-message">{{ toast.message }}</span>
      <button class="toast-close" title="Dismiss" @click="emit('dismiss', toast.id)">×</button>
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  max-width: 500px;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  font-weight: 700;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast-success {
  border-left: 4px solid var(--success);
}

.toast-success .toast-icon {
  color: var(--success);
  background-color: rgba(16, 185, 129, 0.2);
}

.toast-error {
  border-left: 4px solid var(--danger);
}

.toast-error .toast-icon {
  color: var(--danger);
  background-color: rgba(239, 68, 68, 0.2);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}

.toast-warning .toast-icon {
  color: var(--warning);
  background-color: rgba(245, 158, 11, 0.2);
}

.toast-info {
  border-left: 4px solid var(--accent-primary);
}

.toast-info .toast-icon {
  color: var(--accent-primary);
  background-color: rgba(59, 130, 246, 0.2);
}

.toast-message {
  flex: 1;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  transition: all 0.2s;
}

.toast-close:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

@media (max-width: 767px) {
  .toast-container {
    top: auto;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
  }

  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
