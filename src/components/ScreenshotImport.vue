<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScreenshotImport } from '../composables/useScreenshotImport'
import type { ImportResult } from '../composables/useScreenshotImport'

// -------------------------------------------------------------------------
// Props / emits
// -------------------------------------------------------------------------

const emit = defineEmits<{
  close: []
  imported: []
}>()

// -------------------------------------------------------------------------
// Composable
// -------------------------------------------------------------------------

const {
  isProcessing,
  progress,
  results,
  errors,
  previewImage,
  hasResults,
  matchedCount,
  ambiguousCount,
  unrecognizedCount,
  processImage,
  processClipboardEvent,
  resolveAmbiguousItem,
  applyToInventory,
  clearResults,
  imageSize,
} = useScreenshotImport()

// -------------------------------------------------------------------------
// Drop-zone state
// -------------------------------------------------------------------------

const isDraggingOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// -------------------------------------------------------------------------
// Input handling
// -------------------------------------------------------------------------

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  isDraggingOver.value = true
}

function handleDragLeave(): void {
  isDraggingOver.value = false
}

function handleDrop(event: DragEvent): void {
  event.preventDefault()
  isDraggingOver.value = false

  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processImage(file)
  }
}

function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    processImage(file)
  }
  // Reset so the same file can be selected again
  input.value = ''
}

function openFilePicker(): void {
  fileInputRef.value?.click()
}

// -------------------------------------------------------------------------
// Global paste handler (active for the lifetime of the component)
// -------------------------------------------------------------------------

function handleGlobalPaste(event: ClipboardEvent): void {
  // Only intercept if there is image data
  const hasImage = Array.from(event.clipboardData?.items ?? []).some((item) =>
    item.type.startsWith('image/'),
  )
  if (!hasImage) return
  event.preventDefault()
  processClipboardEvent(event)
}

onMounted(() => {
  document.addEventListener('paste', handleGlobalPaste)
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', handleGlobalPaste)
})

// -------------------------------------------------------------------------
// Results helpers
// -------------------------------------------------------------------------

/**
 * Progress percentage clamped to [0, 100].
 */
function progressPercent(): number {
  if (!progress.value.total) return 0
  return Math.min(100, Math.round((progress.value.current / progress.value.total) * 100))
}

function confidenceClass(result: ImportResult): string {
  if (result.status === 'ambiguous') return 'badge-amber'
  if (result.confidence >= 0.8) return 'badge-green'
  if (result.confidence >= 0.5) return 'badge-yellow'
  return 'badge-red'
}

function confidenceLabel(result: ImportResult): string {
  if (result.status === 'ambiguous') return 'Ambiguous'
  if (result.confidence >= 0.8) return 'High'
  if (result.confidence >= 0.5) return 'Low'
  return 'Poor'
}

function cellBorderClass(result: ImportResult): string {
  if (result.status === 'ambiguous') return 'cell-amber'
  if (result.confidence >= 0.8) return 'cell-green'
  return 'cell-yellow'
}

function cellOverlayStyle(rect: { x: number; y: number; w: number; h: number }): Record<string, string> {
  const img = imageSize.value
  if (!img || img.width === 0 || img.height === 0) return {}
  return {
    left: `${(rect.x / img.width) * 100}%`,
    top: `${(rect.y / img.height) * 100}%`,
    width: `${(rect.w / img.width) * 100}%`,
    height: `${(rect.h / img.height) * 100}%`,
  }
}

// -------------------------------------------------------------------------
// Per-row quantity editing
// -------------------------------------------------------------------------

const editingQuantities = ref<Record<string, string>>({})

function rowKey(result: ImportResult): string {
  return `${result.gridPosition.row}-${result.gridPosition.col}`
}

function quantityForRow(result: ImportResult): string {
  const key = rowKey(result)
  return editingQuantities.value[key] ?? String(result.quantity)
}

function onQuantityInput(result: ImportResult, event: Event): void {
  const input = event.target as HTMLInputElement
  const key = rowKey(result)
  editingQuantities.value[key] = input.value
  const parsed = parseInt(input.value)
  if (!isNaN(parsed) && parsed >= 0) {
    result.quantity = parsed
  }
}

// -------------------------------------------------------------------------
// Ambiguous resolution
// -------------------------------------------------------------------------

function onResolve(result: ImportResult, event: Event): void {
  const select = event.target as HTMLSelectElement
  if (select.value) {
    resolveAmbiguousItem(result.gridPosition, select.value)
  }
}

// -------------------------------------------------------------------------
// Actions
// -------------------------------------------------------------------------

function handleApply(): void {
  applyToInventory()
  clearResults()
  emit('imported')
  emit('close')
}

function handleCancel(): void {
  clearResults()
  emit('close')
}

function handleRescan(): void {
  clearResults()
}
</script>

<template>
  <div class="screenshot-import-overlay" role="dialog" aria-modal="true" aria-label="Import from Screenshot">
    <!-- Backdrop -->
    <div class="si-backdrop" @click="handleCancel" />

    <!-- Modal panel -->
    <div class="si-panel">
      <!-- Header -->
      <div class="si-header">
        <div class="si-header-title">
          <svg
class="si-header-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Import from Screenshot
        </div>
        <button class="si-close-btn" aria-label="Close" @click="handleCancel">
          <svg
width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="si-body">

        <!-- ============================================================
             STATE 1: Drop zone (no results, not processing)
             ============================================================ -->
        <template v-if="!isProcessing && !hasResults">
          <div
            class="si-dropzone"
            :class="{ 'si-dropzone--active': isDraggingOver }"
            role="button"
            tabindex="0"
            aria-label="Drop screenshot here or press Ctrl+V to paste"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            @click="openFilePicker"
            @keyup.enter="openFilePicker"
            @keyup.space="openFilePicker"
          >
            <div class="si-dropzone-icon">
              <svg
width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p class="si-dropzone-primary">Paste a screenshot (Ctrl+V) or drop an image here</p>
            <p class="si-dropzone-secondary">You can also click to browse for a file</p>
            <button class="si-browse-btn" type="button" @click.stop="openFilePicker">
              Browse file
            </button>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="si-file-input"
            aria-hidden="true"
            @change="handleFileChange"
          />
        </template>

        <!-- ============================================================
             STATE 2: Processing
             ============================================================ -->
        <template v-else-if="isProcessing">
          <div class="si-processing">
            <!-- Screenshot thumbnail -->
            <div v-if="previewImage" class="si-thumb-wrap">
              <img :src="previewImage" alt="Processing screenshot" class="si-thumb" />
              <div class="si-thumb-overlay">
                <div class="si-spinner" aria-hidden="true" />
              </div>
            </div>
            <div v-else class="si-processing-placeholder">
              <div class="si-spinner si-spinner--lg" aria-hidden="true" />
            </div>

            <div class="si-progress-wrap">
              <p class="si-progress-step" aria-live="polite">{{ progress.step }}</p>
              <div
class="si-progress-bar-track" role="progressbar"
                :aria-valuenow="progressPercent()"
                aria-valuemin="0" aria-valuemax="100">
                <div
                  class="si-progress-bar-fill"
                  :style="{ width: progress.total > 0 ? `${progressPercent()}%` : '100%' }"
                  :class="{ 'si-progress-bar-fill--indeterminate': progress.total === 0 }"
                />
              </div>
              <p v-if="progress.total > 0" class="si-progress-count">
                {{ progress.current }} / {{ progress.total }}
              </p>
            </div>
          </div>
        </template>

        <!-- ============================================================
             STATE 3: Results review
             ============================================================ -->
        <template v-else-if="hasResults">
          <!-- Summary bar -->
          <div class="si-summary">
            <span class="si-summary-chip si-summary-chip--green">
              <svg
width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ matchedCount }} matched
            </span>
            <span v-if="ambiguousCount > 0" class="si-summary-chip si-summary-chip--amber">
              <svg
width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {{ ambiguousCount }} ambiguous
            </span>
            <span v-if="unrecognizedCount > 0" class="si-summary-chip si-summary-chip--gray">
              <svg
width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {{ unrecognizedCount }} unrecognized
            </span>
          </div>

          <!-- Split layout: preview + list -->
          <div class="si-review-layout">

            <!-- Left: Screenshot preview with cell overlays -->
            <div v-if="previewImage" class="si-preview-pane">
              <p class="si-pane-label">Screenshot</p>
              <div class="si-preview-frame">
                <img :src="previewImage" alt="Inventory screenshot" class="si-preview-img" />
                <!-- Per-cell colored overlays positioned via CSS grid approximation -->
                <div
                  v-for="result in results"
                  :key="rowKey(result)"
                  class="si-cell-overlay"
                  :class="cellBorderClass(result)"
                  :style="cellOverlayStyle(result.cellRect)"
                  :title="result.name"
                />
                <div
                  v-for="err in errors.filter(e => e.reason === 'no_match')"
                  :key="`err-${err.gridPosition.row}-${err.gridPosition.col}`"
                  class="si-cell-overlay si-cell-overlay--error"
                  :style="cellOverlayStyle(err.cellRect)"
                  title="Unrecognized item"
                />
              </div>
              <!-- Legend -->
              <div class="si-legend">
                <span class="si-legend-item">
                  <span class="si-legend-dot si-legend-dot--green" />
                  High confidence
                </span>
                <span class="si-legend-item">
                  <span class="si-legend-dot si-legend-dot--yellow" />
                  Low confidence
                </span>
                <span class="si-legend-item">
                  <span class="si-legend-dot si-legend-dot--amber" />
                  Ambiguous
                </span>
                <span class="si-legend-item">
                  <span class="si-legend-dot si-legend-dot--red" />
                  Unrecognized
                </span>
              </div>
            </div>

            <!-- Right: Results list -->
            <div class="si-results-pane">
              <p class="si-pane-label">Detected items</p>
              <div class="si-results-list">

                <!-- Matched items section -->
                <template v-if="results.filter(r => r.status !== 'ambiguous' || r.resolvedHashedId).length > 0">
                  <p class="si-section-label">Matched items</p>
                  <div
                    v-for="result in results.filter(r => r.status !== 'ambiguous' || r.resolvedHashedId)"
                    :key="rowKey(result)"
                    class="si-result-row si-result-row--matched"
                  >
                    <!-- Cell preview thumbnail -->
                    <div class="si-cell-thumb">
                      <img
v-if="result.cellPreview" :src="result.cellPreview"
                        :alt="result.name" class="si-cell-thumb-img" />
                      <div v-else class="si-cell-thumb-placeholder" />
                    </div>

                    <div class="si-result-info">
                      <span class="si-result-name">{{ result.name }}</span>
                      <span
:class="['si-badge', confidenceClass(result)]"
                        :title="result.status === 'ambiguous' ? 'This sprite is shared by multiple items' : undefined">
                        {{ confidenceLabel(result) }}
                      </span>
                    </div>

                    <div class="si-result-qty">
                      <label :for="`qty-${rowKey(result)}`" class="si-qty-label">Qty</label>
                      <input
                        :id="`qty-${rowKey(result)}`"
                        type="number"
                        min="0"
                        class="si-qty-input"
                        :value="quantityForRow(result)"
                        @input="onQuantityInput(result, $event)"
                      />
                    </div>
                  </div>
                </template>

                <!-- Ambiguous items section -->
                <template v-if="results.filter(r => r.status === 'ambiguous' && !r.resolvedHashedId).length > 0">
                  <p class="si-section-label si-section-label--amber">Ambiguous items</p>
                  <div
                    v-for="result in results.filter(r => r.status === 'ambiguous' && !r.resolvedHashedId)"
                    :key="`amb-${rowKey(result)}`"
                    class="si-result-row si-result-row--ambiguous"
                  >
                    <!-- Cell preview thumbnail -->
                    <div class="si-cell-thumb">
                      <img
v-if="result.cellPreview" :src="result.cellPreview"
                        :alt="'Ambiguous item'" class="si-cell-thumb-img" />
                      <div v-else class="si-cell-thumb-placeholder" />
                    </div>

                    <div class="si-result-info si-result-info--col">
                      <span class="si-badge badge-amber" title="This sprite is shared by multiple items">
                        Ambiguous
                      </span>
                      <span class="si-ambiguous-desc">
                        Could not distinguish between:
                        {{ (result.duplicateGroup ?? [result.name]).join(', ') }}
                      </span>
                      <!-- Resolution dropdown -->
                      <select class="si-resolve-select" @change="onResolve(result, $event)">
                        <option value="">— Select correct item —</option>
                        <option
                          v-for="name in (result.duplicateGroup ?? [result.name])"
                          :key="name"
                          :value="name"
                        >
                          {{ name }}
                        </option>
                      </select>
                    </div>

                    <div class="si-result-qty">
                      <label :for="`qty-amb-${rowKey(result)}`" class="si-qty-label">Qty</label>
                      <input
                        :id="`qty-amb-${rowKey(result)}`"
                        type="number"
                        min="0"
                        class="si-qty-input"
                        :value="quantityForRow(result)"
                        @input="onQuantityInput(result, $event)"
                      />
                    </div>
                  </div>
                </template>

                <!-- Unrecognized items section -->
                <template v-if="errors.filter(e => e.reason === 'no_match').length > 0">
                  <p class="si-section-label si-section-label--gray">Unrecognized items</p>
                  <div
                    v-for="err in errors.filter(e => e.reason === 'no_match')"
                    :key="`err-${err.gridPosition.row}-${err.gridPosition.col}`"
                    class="si-result-row si-result-row--unrecognized"
                  >
                    <div class="si-cell-thumb">
                      <img
v-if="err.cellPreview" :src="err.cellPreview"
                        alt="Unrecognized item" class="si-cell-thumb-img" />
                      <div v-else class="si-cell-thumb-placeholder">
                        <span class="si-unknown-icon">?</span>
                      </div>
                    </div>
                    <div class="si-result-info">
                      <span class="si-result-name si-result-name--muted">Unknown item</span>
                      <span class="si-badge badge-gray">Skipped</span>
                    </div>
                  </div>
                </template>

              </div>
            </div>
          </div>
        </template>

      </div>

      <!-- Footer actions -->
      <div class="si-footer">
        <template v-if="hasResults && !isProcessing">
          <button class="si-btn si-btn--tertiary" @click="handleRescan">
            Re-scan
          </button>
          <div class="si-footer-right">
            <button class="si-btn si-btn--secondary" @click="handleCancel">
              Cancel
            </button>
            <button
              class="si-btn si-btn--primary"
              :disabled="matchedCount === 0"
              @click="handleApply"
            >
              Import {{ matchedCount }} item{{ matchedCount !== 1 ? 's' : '' }} to inventory
            </button>
          </div>
        </template>
        <template v-else>
          <div class="si-footer-right">
            <button class="si-btn si-btn--secondary" @click="handleCancel">
              Cancel
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================================================================
   Overlay / modal shell
   ========================================================================= */

.screenshot-import-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.si-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
}

.si-panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  border-radius: var(--surface-radius);
  box-shadow: var(--surface-shadow), 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* =========================================================================
   Header
   ========================================================================= */

.si-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--surface-border);
  flex-shrink: 0;
}

.si-header-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.si-header-icon {
  color: var(--accent-primary);
  flex-shrink: 0;
}

.si-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-height: unset;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all 0.2s var(--ease-in-out);
  flex-shrink: 0;
}

.si-close-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--surface-border);
  color: var(--text-primary);
  transform: none;
  box-shadow: none;
}

/* =========================================================================
   Body (scrollable area)
   ========================================================================= */

.si-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
}

/* =========================================================================
   STATE 1: Drop zone
   ========================================================================= */

.si-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-6);
  border: 2px dashed var(--border-color);
  border-radius: var(--surface-radius);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s var(--ease-out);
  text-align: center;
  min-height: 220px;
  user-select: none;
}

.si-dropzone:hover,
.si-dropzone:focus-visible {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.04);
  outline: none;
}

.si-dropzone--active {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.08);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.si-dropzone-icon {
  color: var(--accent-primary);
  opacity: 0.6;
}

.si-dropzone-primary {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-primary);
}

.si-dropzone-secondary {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.si-browse-btn {
  margin-top: var(--space-1);
  padding: 0.5rem 1.25rem;
  min-height: unset;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: var(--text-md);
  font-weight: 500;
  transition: all 0.2s var(--ease-in-out);
}

.si-browse-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--accent-primary);
  transform: none;
  box-shadow: none;
}

.si-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* =========================================================================
   STATE 2: Processing
   ========================================================================= */

.si-processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6) 0;
}

.si-thumb-wrap {
  position: relative;
  width: 240px;
  border-radius: var(--surface-radius);
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.si-thumb {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0.4;
}

.si-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.si-processing-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}

/* Spinner */
.si-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(59, 130, 246, 0.25);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: si-spin 0.7s linear infinite;
}

.si-spinner--lg {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

@keyframes si-spin {
  to { transform: rotate(360deg); }
}

.si-progress-wrap {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.si-progress-step {
  font-size: var(--text-md);
  color: var(--text-secondary);
  font-weight: 500;
}

.si-progress-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.si-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), #38bdf8);
  border-radius: 9999px;
  transition: width 0.25s var(--ease-out);
}

.si-progress-bar-fill--indeterminate {
  width: 40% !important;
  animation: si-indeterminate 1.4s ease-in-out infinite;
}

@keyframes si-indeterminate {
  0%   { transform: translateX(-150%); }
  100% { transform: translateX(350%); }
}

.si-progress-count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

/* =========================================================================
   STATE 3: Results review
   ========================================================================= */

/* Summary chips */
.si-summary {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.si-summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.si-summary-chip--green {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.si-summary-chip--amber {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.si-summary-chip--gray {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Split layout */
.si-review-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: var(--space-4);
  align-items: start;
}

.si-pane-label {
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

/* Preview pane */
.si-preview-pane {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
}

.si-preview-frame {
  position: relative;
  position: relative;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.si-preview-img {
  width: 100%;
  height: auto;
  display: block;
}

/* Cell overlay markers (positioned as approximate % based on row/col) */
.si-cell-overlay {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 3px;
  box-sizing: border-box;
  pointer-events: none;
  left: calc(var(--col, 0) * (100% / 8));
  top: calc(var(--row, 0) * (100% / 8));
  transition: opacity 0.2s;
}

.cell-green { border-color: rgba(52, 211, 153, 0.75); background: rgba(52, 211, 153, 0.08); }
.cell-yellow { border-color: rgba(251, 191, 36, 0.75); background: rgba(251, 191, 36, 0.08); }
.cell-amber { border-color: rgba(245, 158, 11, 0.75); background: rgba(245, 158, 11, 0.1); }
.si-cell-overlay--error { border-color: rgba(239, 68, 68, 0.75); background: rgba(239, 68, 68, 0.08); }

/* Legend */
.si-legend {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}

.si-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.si-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.si-legend-dot--green  { border-color: rgba(52, 211, 153, 0.85); }
.si-legend-dot--yellow { border-color: rgba(251, 191, 36, 0.85); }
.si-legend-dot--amber  { border-color: rgba(245, 158, 11, 0.85); }
.si-legend-dot--red    { border-color: rgba(239, 68, 68, 0.85); }

/* Results pane */
.si-results-pane {
  display: flex;
  flex-direction: column;
}

.si-results-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-height: 440px;
  overflow-y: auto;
  padding-right: var(--space-1);
}

.si-section-label {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin: var(--space-2) 0 var(--space-1);
}

.si-section-label--amber {
  color: #fbbf24;
}

.si-section-label--gray {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Individual result row */
.si-result-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  transition: background 0.15s var(--ease-in-out);
}

.si-result-row--matched {
  border-left: 3px solid rgba(52, 211, 153, 0.6);
}

.si-result-row--ambiguous {
  border-left: 3px solid rgba(245, 158, 11, 0.7);
  background: rgba(245, 158, 11, 0.04);
}

.si-result-row--unrecognized {
  border-left: 3px solid rgba(239, 68, 68, 0.4);
  opacity: 0.65;
}

/* Cell thumbnail */
.si-cell-thumb {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-cell-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.si-cell-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-unknown-icon {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 700;
}

/* Item info */
.si-result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.si-result-info--col {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}

.si-result-name {
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.si-result-name--muted {
  color: var(--text-secondary);
}

/* Confidence badges */
.si-badge {
  flex-shrink: 0;
  display: inline-block;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-green  { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.badge-yellow { background: rgba(251, 191, 36, 0.15);  color: #fde68a; }
.badge-amber  { background: rgba(245, 158, 11, 0.2);   color: #fbbf24; }
.badge-red    { background: rgba(239, 68, 68, 0.15);   color: #f87171; }
.badge-gray   { background: rgba(255, 255, 255, 0.06); color: var(--text-secondary); }

/* Ambiguous description */
.si-ambiguous-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Resolve dropdown */
.si-resolve-select {
  min-height: unset;
  height: 30px;
  padding: 0 1.75rem 0 0.5rem;
  font-size: var(--text-sm);
  background-color: var(--bg-tertiary);
  border-color: rgba(245, 158, 11, 0.4);
  color: var(--text-primary);
  border-radius: 6px;
  max-width: 100%;
}

.si-resolve-select:focus {
  border-color: #fbbf24;
  outline-color: #fbbf24;
}

/* Quantity input */
.si-result-qty {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
}

.si-qty-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
}

.si-qty-input {
  width: 64px;
  min-height: unset;
  height: 30px;
  padding: 0.25rem 0.5rem;
  font-size: var(--text-sm);
  text-align: right;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.si-qty-input:focus {
  border-color: var(--accent-primary);
  outline-color: var(--accent-primary);
}

/* =========================================================================
   Footer
   ========================================================================= */

.si-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  border-top: 1px solid var(--surface-border);
  flex-shrink: 0;
  gap: var(--space-3);
}

.si-footer-right {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.si-btn {
  padding: 0.5rem 1.25rem;
  min-height: unset;
  height: 38px;
  border-radius: 6px;
  font-size: var(--text-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--ease-in-out);
}

.si-btn:hover {
  transform: none;
  box-shadow: none;
}

.si-btn--primary {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  border: 1px solid var(--accent-primary);
  color: white;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
}

.si-btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-hover) 0%, #1e40af 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.si-btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.si-btn--secondary {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.si-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.si-btn--tertiary {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
}

.si-btn--tertiary:hover {
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* =========================================================================
   Responsive — mobile
   ========================================================================= */

@media (max-width: 767px) {
  .screenshot-import-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .si-panel {
    max-width: 100%;
    max-height: 95vh;
    border-radius: var(--surface-radius) var(--surface-radius) 0 0;
  }

  .si-review-layout {
    grid-template-columns: 1fr;
  }

  .si-preview-pane {
    position: static;
  }

  .si-results-list {
    max-height: 280px;
  }

  .si-result-name {
    max-width: 120px;
  }

  .si-body {
    padding: var(--space-4);
  }

  .si-header {
    padding: var(--space-3) var(--space-4);
  }

  .si-footer {
    padding: var(--space-3) var(--space-4);
    flex-wrap: wrap;
  }

  .si-footer-right {
    margin-left: 0;
  }

  .si-btn--primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
