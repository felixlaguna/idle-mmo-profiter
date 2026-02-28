<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { storageManager } from '../storage/persistence'
import { useApiKeyValidation } from '../composables/useApiKeyValidation'

// Get API key from storageManager
const settings = ref(storageManager.getSettings())
const apiKey = computed({
  get: () => settings.value.apiKey,
  set: (value) => {
    settings.value.apiKey = value
    storageManager.saveSettings(settings.value)
  },
})

const inputValue = ref(apiKey.value || '')
const showKey = ref(false)

const { isValidating, lastValidation, validateApiKey } = useApiKeyValidation()

const hasApiKey = computed(() => apiKey.value !== null && apiKey.value !== '')
const statusText = computed(() => {
  if (lastValidation.value?.isValid) {
    return 'Valid API key'
  }
  return hasApiKey.value ? 'API key saved' : 'No API key'
})

const inputType = computed(() => (showKey.value ? 'text' : 'password'))

// Validate API key when saved
const saveApiKey = async () => {
  if (!inputValue.value.trim()) {
    alert('Please enter a valid API key')
    return
  }

  const trimmedKey = inputValue.value.trim()

  // Validate the key with the API
  const result = await validateApiKey(trimmedKey)

  if (result.isValid) {
    // Save the key if valid
    apiKey.value = trimmedKey
    alert('API key validated and saved successfully!')
  } else {
    // Show error but don't save
    alert(`API key validation failed: ${result.error}`)
  }
}

const clearApiKey = () => {
  if (confirm('Are you sure you want to clear your API key?')) {
    apiKey.value = null
    inputValue.value = ''
    // Clear validation result when key is cleared
    lastValidation.value = null
  }
}

const toggleShowKey = () => {
  showKey.value = !showKey.value
}

// Update input value when storage changes (e.g., from import)
watch(apiKey, (newKey) => {
  if (newKey && newKey !== inputValue.value) {
    inputValue.value = newKey
  }
})

// Format expiry date
const formatExpiry = (expiryDate: string): string => {
  const date = new Date(expiryDate)
  const now = new Date()

  if (date < now) {
    return 'Expired'
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Reactive countdown for rate limit reset
const now = ref(Date.now())
let countdownInterval: ReturnType<typeof setInterval> | null = null

const resetCountdown = computed(() => {
  if (!lastValidation.value?.rateLimitReset) return null
  const resetMs = lastValidation.value.rateLimitReset * 1000
  const diffMs = resetMs - now.value
  if (diffMs <= 0) return 'now'
  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
})

// Start countdown when we have a reset time, reset locally when it expires
watch(
  () => lastValidation.value?.rateLimitReset,
  (resetTime) => {
    if (countdownInterval) clearInterval(countdownInterval)
    if (resetTime) {
      countdownInterval = setInterval(() => {
        now.value = Date.now()
        if (resetTime * 1000 <= now.value) {
          if (countdownInterval) clearInterval(countdownInterval)
          // Reset rate limit locally - no API call needed
          if (lastValidation.value) {
            lastValidation.value = {
              ...lastValidation.value,
              rateLimitRemaining: lastValidation.value.keyInfo?.rate_limit ?? 20,
              rateLimitReset: null,
            }
          }
        }
      }, 1000)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

// Validate existing API key on mount if present
if (hasApiKey.value) {
  validateApiKey(apiKey.value!)
}
</script>

<template>
  <div class="api-key-input">
    <div class="header">
      <h3>API Key</h3>
      <span
        class="status"
        :class="{
          valid: lastValidation?.isValid,
          saved: hasApiKey && !lastValidation?.isValid,
        }"
      >
        {{ statusText }}
      </span>
    </div>

    <!-- Warning banner when no API key is set -->
    <div v-if="!hasApiKey" class="warning-banner">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text"> Using default data. Enter your API key to get live prices. </span>
    </div>

    <div class="input-row">
      <input
        v-model="inputValue"
        :type="inputType"
        placeholder="Enter your IdleMMO API key"
        class="key-input"
        :disabled="isValidating"
      />
      <button
        class="btn-toggle"
        :title="showKey ? 'Hide key' : 'Show key'"
        :disabled="isValidating"
        @click="toggleShowKey"
      >
        {{ showKey ? '👁️' : '🔒' }}
      </button>
    </div>

    <div class="actions">
      <button class="btn-save" :disabled="isValidating" @click="saveApiKey">
        {{ isValidating ? 'Validating...' : 'Save & Validate' }}
      </button>
      <button class="btn-clear" :disabled="!hasApiKey || isValidating" @click="clearApiKey">
        Clear
      </button>
    </div>

    <!-- Validation result display -->
    <div
      v-if="lastValidation && lastValidation.isValid && lastValidation.keyInfo"
      class="validation-info"
    >
      <div class="info-section">
        <h4 class="info-title">API Key Information</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">{{ lastValidation.keyInfo.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Rate Limit:</span>
            <span class="info-value">{{ lastValidation.keyInfo.rate_limit }} requests/min</span>
          </div>
          <div class="info-item">
            <span class="info-label">Expires:</span>
            <span class="info-value">{{ formatExpiry(lastValidation.keyInfo.expires_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Scopes:</span>
            <span class="info-value">{{ lastValidation.keyInfo.scopes?.join(', ') || 'All' }}</span>
          </div>
        </div>
      </div>

      <!-- Rate limit status -->
      <div v-if="lastValidation.rateLimitRemaining !== null" class="info-section">
        <h4 class="info-title">Current Rate Limit Status</h4>
        <div class="rate-limit-bar">
          <div class="rate-limit-text">
            <span
              >{{ lastValidation.rateLimitRemaining }} /
              {{ lastValidation.keyInfo.rate_limit }} remaining</span
            >
            <span v-if="resetCountdown" class="reset-time"> Resets in {{ resetCountdown }} </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{
                width: `${(lastValidation.rateLimitRemaining / lastValidation.keyInfo.rate_limit) * 100}%`,
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error display -->
    <div v-if="lastValidation && !lastValidation.isValid" class="error-info">
      <span class="error-icon">❌</span>
      <span class="error-text">{{ lastValidation.error }}</span>
    </div>

    <!-- Link to create API key -->
    <div class="help-text">
      <span>Don't have an API key?</span>
      <a
        href="https://www.idle-mmo.com/preferences/api"
        target="_blank"
        rel="noopener noreferrer"
        class="help-link"
      >
        Create one here
      </a>
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

.status.valid {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status.saved {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary);
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 0.375rem;
}

.warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-text {
  font-size: 0.875rem;
  color: var(--warning);
  font-weight: 500;
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

.key-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn-toggle:hover:not(:disabled) {
  background-color: var(--bg-primary);
}

.btn-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.btn-save:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.validation-info {
  background-color: var(--bg-tertiary);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-section {
  margin-bottom: 1rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

.rate-limit-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rate-limit-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.reset-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: var(--bg-primary);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--success);
  transition: width 0.3s ease;
}

.error-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.375rem;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-text {
  font-size: 0.875rem;
  color: var(--danger);
  font-weight: 500;
}

.help-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
}

.help-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  margin-left: 0.25rem;
}

.help-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-clear {
    width: 100%;
  }
}
</style>
