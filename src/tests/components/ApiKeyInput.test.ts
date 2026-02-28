import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ApiKeyInput from '../../components/ApiKeyInput.vue'

// Mock fetch globally
global.fetch = vi.fn()

// Mock alert and confirm
global.alert = vi.fn()
global.confirm = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('ApiKeyInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('should render with no API key', () => {
    const wrapper = mount(ApiKeyInput)

    expect(wrapper.find('.warning-banner').exists()).toBe(true)
    expect(wrapper.find('.warning-banner').text()).toContain(
      'Using default data. Enter your API key to get live prices.'
    )
    expect(wrapper.find('.status').text()).toBe('No API key')
  })

  it('should show/hide API key when toggle button is clicked', async () => {
    const wrapper = mount(ApiKeyInput)

    const input = wrapper.find('.key-input')
    const toggleBtn = wrapper.find('.btn-toggle')

    // Initially should be password type
    expect(input.attributes('type')).toBe('password')
    expect(toggleBtn.text()).toBe('🔒')

    // Click toggle
    await toggleBtn.trigger('click')

    // Should be text type now
    expect(input.attributes('type')).toBe('text')
    expect(toggleBtn.text()).toBe('👁️')

    // Click toggle again
    await toggleBtn.trigger('click')

    // Should be password type again
    expect(input.attributes('type')).toBe('password')
    expect(toggleBtn.text()).toBe('🔒')
  })

  it('should validate API key when save button is clicked', async () => {
    const mockResponse = {
      authenticated: true,
      user: { id: 12345 },
      character: { id: 67890, hashed_id: 'c123', name: 'TestChar' },
      api_key: {
        name: 'Test API Key',
        rate_limit: 20,
        expires_at: '2025-12-31T23:59:59.000000Z',
        scopes: ['v1.auth.check'],
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([
        ['X-RateLimit-Remaining', '19'],
        ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60)],
      ]),
      json: async () => mockResponse,
    })

    const wrapper = mount(ApiKeyInput)

    const input = wrapper.find('.key-input')
    await input.setValue('test-api-key-123')

    const saveBtn = wrapper.find('.btn-save')
    await saveBtn.trigger('click')

    // Wait for async validation
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/auth/check',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key-123',
        }),
      })
    )

    expect(global.alert).toHaveBeenCalledWith('API key validated and saved successfully!')
  })

  it('should show error when API key validation fails', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Map(),
    })

    const wrapper = mount(ApiKeyInput)

    const input = wrapper.find('.key-input')
    await input.setValue('invalid-key')

    const saveBtn = wrapper.find('.btn-save')
    await saveBtn.trigger('click')

    // Wait for async validation
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(global.alert).toHaveBeenCalledWith(
      'API key validation failed: Authentication failed - Invalid API key'
    )
  })

  it('should show validation info when API key is valid', async () => {
    const mockResponse = {
      authenticated: true,
      user: { id: 12345 },
      character: { id: 67890, hashed_id: 'c123', name: 'TestChar' },
      api_key: {
        name: 'Test API Key',
        rate_limit: 20,
        expires_at: '2025-12-31T23:59:59.000000Z',
        scopes: ['v1.auth.check', 'v1.market.items'],
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([
        ['X-RateLimit-Remaining', '19'],
        ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60)],
      ]),
      json: async () => mockResponse,
    })

    const wrapper = mount(ApiKeyInput)

    const input = wrapper.find('.key-input')
    await input.setValue('test-api-key-123')

    const saveBtn = wrapper.find('.btn-save')
    await saveBtn.trigger('click')

    // Wait for async validation and re-render
    await new Promise((resolve) => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.validation-info').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test API Key')
    expect(wrapper.text()).toContain('20 requests/min')
    expect(wrapper.text()).toContain('v1.auth.check, v1.market.items')
  })

  it('should clear API key when clear button is clicked', async () => {
    // Set initial API key in localStorage
    localStorageMock.setItem(
      'immo-profit:settings',
      JSON.stringify({
        apiKey: 'existing-key',
        marketTaxRate: 0.12,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      })
    )
    ;(global.confirm as any).mockReturnValue(true)

    const wrapper = mount(ApiKeyInput)

    // Wait for component to load initial state
    await wrapper.vm.$nextTick()

    const clearBtn = wrapper.find('.btn-clear')
    await clearBtn.trigger('click')

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to clear your API key?')

    // Check that the key was cleared (apiKey should be null)
    const storedValue = localStorageMock.getItem('immo-profit:settings')
    const parsed = storedValue ? JSON.parse(storedValue) : null
    expect(parsed === null || parsed.apiKey === null).toBe(true)
  })

  it('should not clear API key when confirmation is cancelled', async () => {
    // Set initial API key in localStorage
    localStorageMock.setItem(
      'immo-profit:settings',
      JSON.stringify({
        apiKey: 'existing-key',
        marketTaxRate: 0.12,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      })
    )
    ;(global.confirm as any).mockReturnValue(false)

    const wrapper = mount(ApiKeyInput)

    // Wait for component to load initial state
    await wrapper.vm.$nextTick()

    const clearBtn = wrapper.find('.btn-clear')
    await clearBtn.trigger('click')

    expect(global.confirm).toHaveBeenCalled()
    const storedValue = localStorageMock.getItem('immo-profit:settings')
    const parsed = JSON.parse(storedValue!)
    expect(parsed.apiKey).toBe('existing-key')
  })

  it('should show error when trying to save empty API key', async () => {
    const wrapper = mount(ApiKeyInput)

    const saveBtn = wrapper.find('.btn-save')
    await saveBtn.trigger('click')

    expect(global.alert).toHaveBeenCalledWith('Please enter a valid API key')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should disable inputs while validating', async () => {
    let resolvePromise: any
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(global.fetch as any).mockReturnValueOnce(delayedPromise)

    const wrapper = mount(ApiKeyInput)

    const input = wrapper.find('.key-input')
    await input.setValue('test-key')

    const saveBtn = wrapper.find('.btn-save')
    const toggleBtn = wrapper.find('.btn-toggle')
    const clearBtn = wrapper.find('.btn-clear')

    // Start validation
    saveBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Inputs should be disabled
    expect(input.attributes('disabled')).toBeDefined()
    expect(toggleBtn.attributes('disabled')).toBeDefined()
    expect(saveBtn.attributes('disabled')).toBeDefined()
    expect(clearBtn.attributes('disabled')).toBeDefined()

    // Save button text should change
    expect(saveBtn.text()).toBe('Validating...')

    // Resolve the promise
    resolvePromise({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => ({
        authenticated: true,
        api_key: {
          name: 'Test',
          rate_limit: 20,
          expires_at: '2025-12-31T23:59:59.000000Z',
          scopes: ['v1.auth.check'],
        },
      }),
    })

    await new Promise((resolve) => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    // Inputs should be enabled again
    expect(input.attributes('disabled')).toBeUndefined()
    expect(toggleBtn.attributes('disabled')).toBeUndefined()
    expect(saveBtn.attributes('disabled')).toBeUndefined()
  })

  it('should show rate limit status', async () => {
    const mockResponse = {
      authenticated: true,
      user: { id: 12345 },
      character: { id: 67890, hashed_id: 'c123', name: 'TestChar' },
      api_key: {
        name: 'Test API Key',
        rate_limit: 20,
        expires_at: '2025-12-31T23:59:59.000000Z',
        scopes: ['v1.auth.check'],
      },
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([
        ['X-RateLimit-Remaining', '15'],
        ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 45)],
      ]),
      json: async () => mockResponse,
    })

    const wrapper = mount(ApiKeyInput)

    const input = wrapper.find('.key-input')
    await input.setValue('test-api-key')

    const saveBtn = wrapper.find('.btn-save')
    await saveBtn.trigger('click')

    // Wait for async validation
    await new Promise((resolve) => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('15 / 20 remaining')
    expect(wrapper.text()).toContain('Resets in')
  })

  it('should show link to create API key', () => {
    const wrapper = mount(ApiKeyInput)

    const link = wrapper.find('.help-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://www.idle-mmo.com/preferences/api')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toBe('Create one here')
  })
})
