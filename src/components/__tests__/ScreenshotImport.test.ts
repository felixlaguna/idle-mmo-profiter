import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'
import ScreenshotImport from '../ScreenshotImport.vue'

// ---------------------------------------------------------------------------
// Mock the composable
// ---------------------------------------------------------------------------

const mockResults = ref<any[]>([])
const mockErrors = ref<any[]>([])
const mockIsProcessing = ref(false)
const mockProgress = ref({ step: 'Idle', current: 0, total: 0 })
const mockPreviewImage = ref<string | null>(null)
const mockHasResults = computed(
  () => mockResults.value.length > 0 || mockErrors.value.length > 0,
)
const mockMatchedCount = computed(
  () => mockResults.value.filter((r) => r.status === 'matched' || r.resolvedHashedId).length,
)
const mockAmbiguousCount = computed(
  () => mockResults.value.filter((r) => r.status === 'ambiguous' && !r.resolvedHashedId).length,
)
const mockUnrecognizedCount = computed(
  () => mockErrors.value.filter((e) => e.reason === 'no_match').length,
)

const mockProcessImage = vi.fn()
const mockProcessClipboardEvent = vi.fn()
const mockResolveAmbiguousItem = vi.fn()
const mockApplyToInventory = vi.fn()
const mockClearResults = vi.fn()

vi.mock('../../composables/useScreenshotImport', () => ({
  useScreenshotImport: () => ({
    isProcessing: mockIsProcessing,
    progress: mockProgress,
    results: mockResults,
    errors: mockErrors,
    previewImage: mockPreviewImage,
    hasResults: mockHasResults,
    matchedCount: mockMatchedCount,
    ambiguousCount: mockAmbiguousCount,
    unrecognizedCount: mockUnrecognizedCount,
    processImage: mockProcessImage,
    processClipboardEvent: mockProcessClipboardEvent,
    resolveAmbiguousItem: mockResolveAmbiguousItem,
    applyToInventory: mockApplyToInventory,
    clearResults: mockClearResults,
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<any> = {}): any {
  return {
    hashedId: 'item-abc',
    name: 'Iron Ore',
    quantity: 5,
    confidence: 0.9,
    matchDistance: 6,
    status: 'matched',
    cellPreview: undefined,
    gridPosition: { row: 0, col: 0 },
    ...overrides,
  }
}

function makeError(overrides: Partial<any> = {}): any {
  return {
    gridPosition: { row: 1, col: 1 },
    reason: 'no_match',
    cellPreview: undefined,
    ...overrides,
  }
}

function mountComponent() {
  return mount(ScreenshotImport, {
    attachTo: document.body,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScreenshotImport', () => {
  beforeEach(() => {
    mockResults.value = []
    mockErrors.value = []
    mockIsProcessing.value = false
    mockProgress.value = { step: 'Idle', current: 0, total: 0 }
    mockPreviewImage.value = null
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // State 1: Drop zone
  // -------------------------------------------------------------------------

  describe('drop zone (initial state)', () => {
    it('renders the drop zone when idle with no results', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.si-dropzone').exists()).toBe(true)
    })

    it('shows primary instruction text', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.si-dropzone-primary').text()).toContain('Ctrl+V')
    })

    it('shows browse button', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.si-browse-btn').exists()).toBe(true)
    })

    it('adds active class on dragover', async () => {
      const wrapper = mountComponent()
      const dropzone = wrapper.find('.si-dropzone')
      await dropzone.trigger('dragover', {
        dataTransfer: { files: [] },
      })
      expect(dropzone.classes()).toContain('si-dropzone--active')
    })

    it('removes active class on dragleave', async () => {
      const wrapper = mountComponent()
      const dropzone = wrapper.find('.si-dropzone')
      await dropzone.trigger('dragover', { dataTransfer: { files: [] } })
      await dropzone.trigger('dragleave')
      expect(dropzone.classes()).not.toContain('si-dropzone--active')
    })

    it('calls processImage when image file is dropped', async () => {
      const wrapper = mountComponent()
      const file = new File(['img'], 'inv.png', { type: 'image/png' })
      await wrapper.find('.si-dropzone').trigger('drop', {
        dataTransfer: { files: [file] },
      })
      expect(mockProcessImage).toHaveBeenCalledWith(file)
    })

    it('does not call processImage when non-image file is dropped', async () => {
      const wrapper = mountComponent()
      const file = new File(['text'], 'note.txt', { type: 'text/plain' })
      await wrapper.find('.si-dropzone').trigger('drop', {
        dataTransfer: { files: [file] },
      })
      expect(mockProcessImage).not.toHaveBeenCalled()
    })

    it('emits close when Cancel button is pressed', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.si-btn--secondary').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // State 2: Processing
  // -------------------------------------------------------------------------

  describe('processing state', () => {
    it('renders spinner when isProcessing is true', async () => {
      mockIsProcessing.value = true
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-processing').exists()).toBe(true)
    })

    it('shows progress step text', async () => {
      mockIsProcessing.value = true
      mockProgress.value = { step: 'Detecting grid…', current: 0, total: 0 }
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-progress-step').text()).toBe('Detecting grid…')
    })

    it('shows progress count when total > 0', async () => {
      mockIsProcessing.value = true
      mockProgress.value = { step: 'Matching items…', current: 8, total: 20 }
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-progress-count').text()).toContain('8')
      expect(wrapper.find('.si-progress-count').text()).toContain('20')
    })

    it('shows screenshot thumbnail when previewImage is set', async () => {
      mockIsProcessing.value = true
      mockPreviewImage.value = 'data:image/png;base64,abc'
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-thumb').exists()).toBe(true)
      expect(wrapper.find('.si-thumb').attributes('src')).toBe('data:image/png;base64,abc')
    })
  })

  // -------------------------------------------------------------------------
  // State 3: Results review
  // -------------------------------------------------------------------------

  describe('results review state', () => {
    it('renders results section when hasResults is true', async () => {
      mockResults.value = [makeResult()]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-summary').exists()).toBe(true)
      expect(wrapper.find('.si-results-list').exists()).toBe(true)
    })

    it('shows matched count chip', async () => {
      mockResults.value = [makeResult({ status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      const greenChip = wrapper.find('.si-summary-chip--green')
      expect(greenChip.exists()).toBe(true)
      expect(greenChip.text()).toContain('1 matched')
    })

    it('shows ambiguous count chip when ambiguous items exist', async () => {
      mockResults.value = [makeResult({ status: 'ambiguous', duplicateGroup: ['Item A', 'Item B'] })]
      const wrapper = mountComponent()
      await flushPromises()
      const amberChip = wrapper.find('.si-summary-chip--amber')
      expect(amberChip.exists()).toBe(true)
      expect(amberChip.text()).toContain('1 ambiguous')
    })

    it('shows unrecognized chip when errors exist', async () => {
      mockResults.value = [makeResult()]
      mockErrors.value = [makeError()]
      const wrapper = mountComponent()
      await flushPromises()
      const grayChip = wrapper.find('.si-summary-chip--gray')
      expect(grayChip.exists()).toBe(true)
      expect(grayChip.text()).toContain('1 unrecognized')
    })

    it('renders matched item row with item name', async () => {
      mockResults.value = [makeResult({ name: 'Iron Ore', status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-result-row--matched').exists()).toBe(true)
      expect(wrapper.find('.si-result-name').text()).toBe('Iron Ore')
    })

    it('shows high confidence badge for confidence >= 0.8', async () => {
      mockResults.value = [makeResult({ confidence: 0.9, status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      const badge = wrapper.find('.badge-green')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('High')
    })

    it('shows low confidence badge for confidence 0.5–0.79', async () => {
      mockResults.value = [makeResult({ confidence: 0.65, status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.badge-yellow').exists()).toBe(true)
    })

    it('shows quantity input with correct initial value', async () => {
      mockResults.value = [makeResult({ quantity: 12, status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      const input = wrapper.find<HTMLInputElement>('.si-qty-input')
      expect(input.element.value).toBe('12')
    })

    it('updates quantity when user edits the input', async () => {
      const result = makeResult({ quantity: 5, status: 'matched' })
      mockResults.value = [result]
      const wrapper = mountComponent()
      await flushPromises()
      const input = wrapper.find<HTMLInputElement>('.si-qty-input')
      await input.setValue('10')
      expect(result.quantity).toBe(10)
    })

    it('renders ambiguous item row in its own section', async () => {
      mockResults.value = [
        makeResult({
          name: 'Mystery Item',
          status: 'ambiguous',
          duplicateGroup: ['Item A', 'Item B'],
        }),
      ]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-result-row--ambiguous').exists()).toBe(true)
    })

    it('shows conflict list description for ambiguous items', async () => {
      mockResults.value = [
        makeResult({
          name: 'Mystery Item',
          status: 'ambiguous',
          duplicateGroup: ['Item A', 'Item B'],
        }),
      ]
      const wrapper = mountComponent()
      await flushPromises()
      const desc = wrapper.find('.si-ambiguous-desc')
      expect(desc.text()).toContain('Item A')
      expect(desc.text()).toContain('Item B')
    })

    it('renders resolution dropdown for ambiguous items', async () => {
      mockResults.value = [
        makeResult({
          status: 'ambiguous',
          duplicateGroup: ['Item A', 'Item B'],
        }),
      ]
      const wrapper = mountComponent()
      await flushPromises()
      const select = wrapper.find('.si-resolve-select')
      expect(select.exists()).toBe(true)
      const options = select.findAll('option')
      // First option is placeholder, then one per group member
      expect(options.length).toBe(3) // placeholder + Item A + Item B
    })

    it('calls resolveAmbiguousItem when dropdown changes', async () => {
      const result = makeResult({
        status: 'ambiguous',
        duplicateGroup: ['Item A', 'Item B'],
        gridPosition: { row: 0, col: 0 },
      })
      mockResults.value = [result]
      const wrapper = mountComponent()
      await flushPromises()
      const select = wrapper.find<HTMLSelectElement>('.si-resolve-select')
      await select.setValue('Item A')
      expect(mockResolveAmbiguousItem).toHaveBeenCalledWith({ row: 0, col: 0 }, 'Item A')
    })

    it('shows amber badge on ambiguous item row', async () => {
      mockResults.value = [
        makeResult({ status: 'ambiguous', duplicateGroup: ['A', 'B'] }),
      ]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.badge-amber').exists()).toBe(true)
    })

    it('renders unrecognized item row', async () => {
      mockResults.value = [makeResult()]
      mockErrors.value = [makeError()]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-result-row--unrecognized').exists()).toBe(true)
    })

    it('disables Import button when matchedCount is 0', async () => {
      mockResults.value = [
        makeResult({ status: 'ambiguous', duplicateGroup: ['A', 'B'] }),
      ]
      const wrapper = mountComponent()
      await flushPromises()
      const importBtn = wrapper.find<HTMLButtonElement>('.si-btn--primary')
      expect(importBtn.element.disabled).toBe(true)
    })

    it('enables Import button when matchedCount > 0', async () => {
      mockResults.value = [makeResult({ status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      const importBtn = wrapper.find<HTMLButtonElement>('.si-btn--primary')
      expect(importBtn.element.disabled).toBe(false)
    })

    it('Import button label shows correct item count', async () => {
      mockResults.value = [
        makeResult({ status: 'matched' }),
        makeResult({ status: 'matched', name: 'Coal', gridPosition: { row: 0, col: 1 } }),
      ]
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('.si-btn--primary').text()).toContain('2 items')
    })

    it('calls applyToInventory and clearResults and emits events on Import click', async () => {
      mockResults.value = [makeResult({ status: 'matched' })]
      const wrapper = mountComponent()
      await flushPromises()
      await wrapper.find('.si-btn--primary').trigger('click')
      expect(mockApplyToInventory).toHaveBeenCalledOnce()
      expect(mockClearResults).toHaveBeenCalledOnce()
      expect(wrapper.emitted('imported')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('calls clearResults and emits close on Re-scan click', async () => {
      mockResults.value = [makeResult()]
      const wrapper = mountComponent()
      await flushPromises()
      await wrapper.find('.si-btn--tertiary').trigger('click')
      expect(mockClearResults).toHaveBeenCalledOnce()
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('calls clearResults and emits close on Cancel click in results view', async () => {
      mockResults.value = [makeResult()]
      const wrapper = mountComponent()
      await flushPromises()
      const cancelBtn = wrapper.findAll('.si-btn--secondary')[0]
      await cancelBtn.trigger('click')
      expect(mockClearResults).toHaveBeenCalledOnce()
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  // -------------------------------------------------------------------------
  // Global paste handler
  // -------------------------------------------------------------------------

  describe('global paste handler', () => {
    it('registers global paste listener on mount', () => {
      const addSpy = vi.spyOn(document, 'addEventListener')
      const wrapper = mountComponent()
      expect(addSpy).toHaveBeenCalledWith('paste', expect.any(Function))
      wrapper.unmount()
      addSpy.mockRestore()
    })

    it('removes global paste listener on unmount', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')
      const wrapper = mountComponent()
      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('paste', expect.any(Function))
      removeSpy.mockRestore()
    })

    it('calls processClipboardEvent when image is pasted globally', async () => {
      const wrapper = mountComponent()

      const imageItem = {
        type: 'image/png',
        getAsFile: () => new File(['img'], 'ss.png', { type: 'image/png' }),
      }

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      })

      // Manually add the image item via defineProperty since DataTransfer items are readonly
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: [imageItem],
        },
        configurable: true,
      })

      document.dispatchEvent(pasteEvent)
      await flushPromises()

      expect(mockProcessClipboardEvent).toHaveBeenCalledWith(pasteEvent)
      wrapper.unmount()
    })
  })

  // -------------------------------------------------------------------------
  // Modal structure
  // -------------------------------------------------------------------------

  describe('modal structure', () => {
    it('renders as a dialog with aria-modal', () => {
      const wrapper = mountComponent()
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.exists()).toBe(true)
      expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('renders header with title', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.si-header-title').text()).toContain('Import from Screenshot')
    })

    it('renders close button', () => {
      const wrapper = mountComponent()
      const closeBtn = wrapper.find('.si-close-btn')
      expect(closeBtn.exists()).toBe(true)
      expect(closeBtn.attributes('aria-label')).toBe('Close')
    })

    it('emits close when close button is clicked', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.si-close-btn').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close when backdrop is clicked', async () => {
      const wrapper = mountComponent()
      await wrapper.find('.si-backdrop').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })
})
