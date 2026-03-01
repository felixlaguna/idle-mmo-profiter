<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  actionText?: string
  actionHref?: string
  secondaryActionText?: string
  variant?: 'default' | 'error' | 'info'
}>()

const emit = defineEmits<{
  (e: 'action'): void
  (e: 'secondary-action'): void
}>()
</script>

<template>
  <div class="empty-state" :class="`empty-state-${variant || 'default'}`" role="status" aria-live="polite">
    <div v-if="icon" class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="actionText || secondaryActionText" class="empty-actions">
      <a v-if="actionText && actionHref" :href="actionHref" class="empty-action empty-action-primary">
        {{ actionText }}
      </a>
      <button v-else-if="actionText" class="empty-action empty-action-primary" @click="emit('action')">
        {{ actionText }}
      </button>
      <button v-if="secondaryActionText" class="empty-action empty-action-secondary" @click="emit('secondary-action')">
        {{ secondaryActionText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  min-height: 300px;
}

.empty-state-error {
  border-color: rgba(239, 68, 68, 0.3);
  background-color: rgba(239, 68, 68, 0.05);
}

.empty-state-info {
  border-color: rgba(59, 130, 246, 0.3);
  background-color: rgba(59, 130, 246, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-action {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.empty-action-primary {
  background-color: var(--accent-primary);
  color: white;
}

.empty-action-primary:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.empty-action-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.empty-action-secondary:hover {
  background-color: var(--bg-primary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
