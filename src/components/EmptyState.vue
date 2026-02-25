<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  actionText?: string
  actionHref?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="empty-state" role="status" aria-live="polite">
    <div v-if="icon" class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <a
      v-if="actionText && actionHref"
      :href="actionHref"
      class="empty-action"
    >
      {{ actionText }}
    </a>
    <button
      v-else-if="actionText"
      class="empty-action"
      @click="emit('action')"
    >
      {{ actionText }}
    </button>
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

.empty-action {
  padding: 0.625rem 1.25rem;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.empty-action:hover {
  background-color: var(--accent-hover);
}
</style>
