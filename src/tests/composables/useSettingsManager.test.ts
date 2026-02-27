/**
 * Tests for useSettingsManager composable - Reset Functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  resetToDefaults,
  resetAll,
  exportSettings,
  importSettings,
} from '../../composables/useSettingsManager'
import { getAllStorageKeys, getRawStorage, setRawStorage } from '../../composables/useStorage'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length() {
      return Object.keys(store).length
    },
  }
})()

global.localStorage = localStorageMock as Storage

// Mock window.confirm
global.confirm = vi.fn(() => true)

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  writable: true,
  value: { reload: vi.fn() },
})

describe('useSettingsManager - Reset Functionality', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('resetToDefaults', () => {
    it('should clear settings keys from localStorage', () => {
      // Set some settings keys
      setRawStorage('magicFind', '100')
      setRawStorage('marketTaxRate', '0.05')
      setRawStorage('someOtherSetting', 'value')

      expect(getRawStorage('magicFind')).toBe('100')
      expect(getRawStorage('marketTaxRate')).toBe('0.05')
      expect(getRawStorage('someOtherSetting')).toBe('value')

      resetToDefaults()

      expect(getRawStorage('magicFind')).toBeNull()
      expect(getRawStorage('marketTaxRate')).toBeNull()
      expect(getRawStorage('someOtherSetting')).toBeNull()
    })

    it('should preserve apiKey when clearing settings', () => {
      // Set apiKey and some other settings
      setRawStorage('apiKey', 'test-api-key-12345')
      setRawStorage('magicFind', '100')
      setRawStorage('marketTaxRate', '0.05')

      expect(getRawStorage('apiKey')).toBe('test-api-key-12345')
      expect(getRawStorage('magicFind')).toBe('100')

      resetToDefaults()

      // apiKey should be preserved
      expect(getRawStorage('apiKey')).toBe('test-api-key-12345')
      // Other settings should be cleared
      expect(getRawStorage('magicFind')).toBeNull()
      expect(getRawStorage('marketTaxRate')).toBeNull()
    })

    it('should clear user-overrides key', () => {
      // Set user overrides and other settings
      const overrides = JSON.stringify({
        materials: { 'material-1': { price: 999 } },
        craftables: { 'craftable-1': { price: 888 } },
      })
      setRawStorage('user-overrides', overrides)
      setRawStorage('magicFind', '100')

      expect(getRawStorage('user-overrides')).toBe(overrides)

      resetToDefaults()

      // user-overrides should be cleared
      expect(getRawStorage('user-overrides')).toBeNull()
      // Other settings should be cleared (except apiKey)
      expect(getRawStorage('magicFind')).toBeNull()
    })

    it('should prompt user for confirmation', () => {
      resetToDefaults()

      expect(global.confirm).toHaveBeenCalledWith(
        'This will reset all settings to defaults (except your API key). Are you sure?'
      )
    })

    it('should not clear anything if user cancels confirmation', () => {
      // Mock confirm to return false (user cancels)
      vi.mocked(global.confirm).mockReturnValueOnce(false)

      setRawStorage('magicFind', '100')
      setRawStorage('apiKey', 'test-key')

      resetToDefaults()

      // Nothing should be cleared
      expect(getRawStorage('magicFind')).toBe('100')
      expect(getRawStorage('apiKey')).toBe('test-key')
    })

    it('should reload page after clearing settings', () => {
      resetToDefaults()

      // Wait for setTimeout to complete
      vi.advanceTimersByTime(2000)

      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  describe('resetAll', () => {
    it('should clear all localStorage keys including apiKey', () => {
      // Set various keys
      setRawStorage('apiKey', 'test-api-key-12345')
      setRawStorage('magicFind', '100')
      setRawStorage('marketTaxRate', '0.05')
      setRawStorage('user-overrides', '{}')

      resetAll()

      // All keys should be cleared
      expect(getRawStorage('apiKey')).toBeNull()
      expect(getRawStorage('magicFind')).toBeNull()
      expect(getRawStorage('marketTaxRate')).toBeNull()
      expect(getRawStorage('user-overrides')).toBeNull()
    })

    it('should clear user-overrides key', () => {
      const overrides = JSON.stringify({
        materials: { 'material-1': { price: 999 } },
      })
      setRawStorage('user-overrides', overrides)

      expect(getRawStorage('user-overrides')).toBe(overrides)

      resetAll()

      expect(getRawStorage('user-overrides')).toBeNull()
    })

    it('should prompt user for confirmation', () => {
      resetAll()

      expect(global.confirm).toHaveBeenCalledWith(
        'This will reset ALL settings including your API key. Are you sure?'
      )
    })

    it('should not clear anything if user cancels confirmation', () => {
      // Mock confirm to return false (user cancels)
      vi.mocked(global.confirm).mockReturnValueOnce(false)

      setRawStorage('apiKey', 'test-key')
      setRawStorage('magicFind', '100')

      resetAll()

      // Nothing should be cleared
      expect(getRawStorage('apiKey')).toBe('test-key')
      expect(getRawStorage('magicFind')).toBe('100')
    })

    it('should reload page after clearing all settings', () => {
      resetAll()

      // Wait for setTimeout to complete
      vi.advanceTimersByTime(2000)

      expect(window.location.reload).toHaveBeenCalled()
    })

    it('should leave localStorage completely empty of idlemmo keys', () => {
      // Set various keys
      setRawStorage('apiKey', 'test-key')
      setRawStorage('magicFind', '100')
      setRawStorage('user-overrides', '{}')

      resetAll()

      // Check that getAllStorageKeys returns empty array
      const remainingKeys = getAllStorageKeys()
      expect(remainingKeys).toEqual([])
    })
  })

  describe('exportSettings', () => {
    it('should export all localStorage keys', () => {
      setRawStorage('apiKey', 'test-key')
      setRawStorage('magicFind', '100')

      // Mock DOM operations
      const createElementSpy = vi.spyOn(document, 'createElement')
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()

      exportSettings()

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('importSettings', () => {
    it('should import settings from valid JSON file', async () => {
      const settingsData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          apiKey: 'imported-key',
          magicFind: '200',
        },
      }

      const blob = new Blob([JSON.stringify(settingsData)], { type: 'application/json' })
      const file = new File([blob], 'settings.json', { type: 'application/json' })

      await importSettings(file)

      expect(getRawStorage('apiKey')).toBe('imported-key')
      expect(getRawStorage('magicFind')).toBe('200')
    })

    it('should reject invalid JSON file', async () => {
      const blob = new Blob(['invalid json'], { type: 'application/json' })
      const file = new File([blob], 'settings.json', { type: 'application/json' })

      await expect(importSettings(file)).rejects.toThrow()
    })
  })

  describe('integration tests', () => {
    it('should handle resetToDefaults followed by resetAll', () => {
      // Set initial data
      setRawStorage('apiKey', 'test-key')
      setRawStorage('magicFind', '100')
      setRawStorage('user-overrides', '{}')

      // Reset to defaults (preserves apiKey)
      resetToDefaults()

      expect(getRawStorage('apiKey')).toBe('test-key')
      expect(getRawStorage('magicFind')).toBeNull()
      expect(getRawStorage('user-overrides')).toBeNull()

      // Set some new settings
      setRawStorage('magicFind', '150')

      // Reset all (clears everything)
      resetAll()

      expect(getRawStorage('apiKey')).toBeNull()
      expect(getRawStorage('magicFind')).toBeNull()
      expect(getAllStorageKeys()).toEqual([])
    })

    it('should clear user overrides even if not found by getAllStorageKeys iteration', () => {
      // This tests the belt-and-suspenders approach
      // Even if the prefix were mismatched, the explicit removeStorage call would still work

      // Set user overrides
      setRawStorage('user-overrides', '{"materials":{"test":{"price":999}}}')

      expect(getRawStorage('user-overrides')).not.toBeNull()

      resetToDefaults()

      // Should be cleared by the explicit removeStorage call
      expect(getRawStorage('user-overrides')).toBeNull()
    })

    it('should preserve only apiKey after resetToDefaults with complex state', () => {
      // Set a complex state with many keys
      setRawStorage('apiKey', 'my-api-key')
      setRawStorage('magicFind', '100')
      setRawStorage('marketTaxRate', '0.05')
      setRawStorage('user-overrides', '{"materials":{"m1":{"price":100}}}')
      setRawStorage('customSetting1', 'value1')
      setRawStorage('customSetting2', 'value2')

      const keysBefore = getAllStorageKeys()
      expect(keysBefore.length).toBeGreaterThan(0)

      resetToDefaults()

      const keysAfter = getAllStorageKeys()
      expect(keysAfter).toEqual(['apiKey'])
      expect(getRawStorage('apiKey')).toBe('my-api-key')
      expect(getRawStorage('user-overrides')).toBeNull()
    })
  })
})
