import { describe, it, expect, beforeEach } from 'vitest'
import { StorageManager } from './persistence'
import type { AppSettings, MagicFindSettings } from '../types'

describe('StorageManager', () => {
  let storage: StorageManager

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    storage = new StorageManager()
  })

  describe('getSettings', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = storage.getSettings()
      expect(settings).toEqual({
        apiKey: null,
        marketTaxRate: 0.12,
        magicFind: {
          streak: 0,
          dungeon: 0,
          item: 0,
          bonus: 0,
        },
      })
    })

    it('should return stored settings from localStorage', () => {
      const customSettings: AppSettings = {
        apiKey: 'test-api-key',
        marketTaxRate: 0.15,
        magicFind: {
          streak: 10,
          dungeon: 5,
          item: 3,
          bonus: 2,
        },
      }
      storage.saveSettings(customSettings)

      const retrieved = storage.getSettings()
      expect(retrieved).toEqual(customSettings)
    })

    it('should merge with defaults if stored settings are partial', () => {
      // Simulate old version with missing fields
      localStorage.setItem(
        'immo-profit:settings',
        JSON.stringify({ apiKey: 'test-key' })
      )

      const settings = storage.getSettings()
      expect(settings.apiKey).toBe('test-key')
      expect(settings.marketTaxRate).toBe(0.12) // From defaults
      expect(settings.magicFind).toBeDefined()
    })

    it('should return defaults if localStorage contains invalid JSON', () => {
      localStorage.setItem('immo-profit:settings', 'invalid-json')

      const settings = storage.getSettings()
      expect(settings.apiKey).toBeNull()
      expect(settings.marketTaxRate).toBe(0.12)
    })
  })

  describe('saveSettings', () => {
    it('should save settings to localStorage', () => {
      const settings: AppSettings = {
        apiKey: 'my-api-key',
        marketTaxRate: 0.1,
        magicFind: {
          streak: 5,
          dungeon: 3,
          item: 2,
          bonus: 1,
        },
      }
      storage.saveSettings(settings)

      const stored = localStorage.getItem('immo-profit:settings')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(settings)
    })

    it('should overwrite existing settings', () => {
      const settings1: AppSettings = {
        apiKey: 'key1',
        marketTaxRate: 0.12,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      }
      const settings2: AppSettings = {
        apiKey: 'key2',
        marketTaxRate: 0.15,
        magicFind: { streak: 10, dungeon: 5, item: 3, bonus: 2 },
      }

      storage.saveSettings(settings1)
      storage.saveSettings(settings2)

      const retrieved = storage.getSettings()
      expect(retrieved).toEqual(settings2)
    })
  })

  describe('getPriceOverrides', () => {
    it('should return empty Map when no overrides exist', () => {
      const overrides = storage.getPriceOverrides()
      expect(overrides).toBeInstanceOf(Map)
      expect(overrides.size).toBe(0)
    })

    it('should return Map of stored overrides', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.setPriceOverride('Gold Ore', 500)

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(2)
      expect(overrides.get('Iron Ore')).toBe(100)
      expect(overrides.get('Gold Ore')).toBe(500)
    })

    it('should return empty Map if localStorage contains invalid JSON', () => {
      localStorage.setItem('immo-profit:overrides', 'invalid-json')

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(0)
    })
  })

  describe('setPriceOverride', () => {
    it('should set a price override', () => {
      storage.setPriceOverride('Iron Ore', 150)

      const overrides = storage.getPriceOverrides()
      expect(overrides.get('Iron Ore')).toBe(150)
    })

    it('should update an existing override', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.setPriceOverride('Iron Ore', 200)

      const overrides = storage.getPriceOverrides()
      expect(overrides.get('Iron Ore')).toBe(200)
    })

    it('should preserve other overrides when setting new one', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.setPriceOverride('Gold Ore', 500)

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(2)
      expect(overrides.get('Iron Ore')).toBe(100)
      expect(overrides.get('Gold Ore')).toBe(500)
    })
  })

  describe('clearPriceOverride', () => {
    it('should remove a specific price override', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.setPriceOverride('Gold Ore', 500)

      storage.clearPriceOverride('Iron Ore')

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(1)
      expect(overrides.has('Iron Ore')).toBe(false)
      expect(overrides.get('Gold Ore')).toBe(500)
    })

    it('should do nothing if override does not exist', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.clearPriceOverride('NonExistent')

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(1)
      expect(overrides.get('Iron Ore')).toBe(100)
    })
  })

  describe('clearAllOverrides', () => {
    it('should remove all price overrides', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.setPriceOverride('Gold Ore', 500)
      storage.setPriceOverride('Silver Ore', 250)

      storage.clearAllOverrides()

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(0)
    })

    it('should not affect settings when clearing overrides', () => {
      const settings: AppSettings = {
        apiKey: 'test-key',
        marketTaxRate: 0.12,
        magicFind: { streak: 5, dungeon: 3, item: 2, bonus: 1 },
      }
      storage.saveSettings(settings)
      storage.setPriceOverride('Iron Ore', 100)

      storage.clearAllOverrides()

      expect(storage.getSettings()).toEqual(settings)
    })
  })

  describe('getMfSettings', () => {
    it('should return default magic find settings', () => {
      const mf = storage.getMfSettings()
      expect(mf).toEqual({
        streak: 0,
        dungeon: 0,
        item: 0,
        bonus: 0,
      })
    })

    it('should return stored magic find settings', () => {
      const customMf: MagicFindSettings = {
        streak: 10,
        dungeon: 5,
        item: 3,
        bonus: 2,
      }
      storage.setMfSettings(customMf)

      const retrieved = storage.getMfSettings()
      expect(retrieved).toEqual(customMf)
    })
  })

  describe('setMfSettings', () => {
    it('should update magic find settings', () => {
      const newMf: MagicFindSettings = {
        streak: 15,
        dungeon: 8,
        item: 4,
        bonus: 3,
      }
      storage.setMfSettings(newMf)

      const settings = storage.getSettings()
      expect(settings.magicFind).toEqual(newMf)
    })

    it('should preserve other settings when updating MF', () => {
      const settings: AppSettings = {
        apiKey: 'test-key',
        marketTaxRate: 0.15,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      }
      storage.saveSettings(settings)

      const newMf: MagicFindSettings = {
        streak: 10,
        dungeon: 5,
        item: 3,
        bonus: 2,
      }
      storage.setMfSettings(newMf)

      const updated = storage.getSettings()
      expect(updated.apiKey).toBe('test-key')
      expect(updated.marketTaxRate).toBe(0.15)
      expect(updated.magicFind).toEqual(newMf)
    })
  })

  describe('exportAll', () => {
    it('should export all data as JSON string', () => {
      const settings: AppSettings = {
        apiKey: 'test-key',
        marketTaxRate: 0.12,
        magicFind: { streak: 5, dungeon: 3, item: 2, bonus: 1 },
      }
      storage.saveSettings(settings)
      storage.setPriceOverride('Iron Ore', 100)
      storage.setPriceOverride('Gold Ore', 500)

      const exported = storage.exportAll()
      const parsed = JSON.parse(exported)

      expect(parsed.version).toBe(1)
      expect(parsed.settings).toEqual(settings)
      expect(parsed.overrides).toEqual({
        'Iron Ore': 100,
        'Gold Ore': 500,
      })
    })

    it('should export empty overrides when none exist', () => {
      const exported = storage.exportAll()
      const parsed = JSON.parse(exported)

      expect(parsed.overrides).toEqual({})
    })

    it('should export with default settings when nothing is stored', () => {
      const exported = storage.exportAll()
      const parsed = JSON.parse(exported)

      expect(parsed.settings.apiKey).toBeNull()
      expect(parsed.settings.marketTaxRate).toBe(0.12)
    })
  })

  describe('importAll', () => {
    it('should import all data from JSON string', () => {
      const exportedData = {
        version: 1,
        settings: {
          apiKey: 'imported-key',
          marketTaxRate: 0.15,
          magicFind: { streak: 10, dungeon: 5, item: 3, bonus: 2 },
        },
        prices: {},
        overrides: {
          'Iron Ore': 200,
          'Gold Ore': 600,
        },
      }

      storage.importAll(JSON.stringify(exportedData))

      const settings = storage.getSettings()
      expect(settings).toEqual(exportedData.settings)

      const overrides = storage.getPriceOverrides()
      expect(overrides.get('Iron Ore')).toBe(200)
      expect(overrides.get('Gold Ore')).toBe(600)
    })

    it('should throw error for invalid JSON', () => {
      expect(() => {
        storage.importAll('invalid-json')
      }).toThrow('Import failed')
    })

    it('should throw error for missing version', () => {
      const invalidData = {
        settings: {},
        overrides: {},
      }

      expect(() => {
        storage.importAll(JSON.stringify(invalidData))
      }).toThrow('Invalid import data structure')
    })

    it('should throw error for missing settings', () => {
      const invalidData = {
        version: 1,
        overrides: {},
      }

      expect(() => {
        storage.importAll(JSON.stringify(invalidData))
      }).toThrow('Invalid import data structure')
    })

    it('should overwrite existing data on import', () => {
      storage.saveSettings({
        apiKey: 'old-key',
        marketTaxRate: 0.12,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      })
      storage.setPriceOverride('Old Item', 99)

      const newData = {
        version: 1,
        settings: {
          apiKey: 'new-key',
          marketTaxRate: 0.15,
          magicFind: { streak: 5, dungeon: 5, item: 5, bonus: 5 },
        },
        prices: {},
        overrides: {
          'New Item': 200,
        },
      }

      storage.importAll(JSON.stringify(newData))

      const settings = storage.getSettings()
      expect(settings.apiKey).toBe('new-key')

      const overrides = storage.getPriceOverrides()
      expect(overrides.has('Old Item')).toBe(false)
      expect(overrides.get('New Item')).toBe(200)
    })
  })

  describe('applyPriceOverride', () => {
    it('should return base price when no override exists', () => {
      const price = storage.applyPriceOverride('Iron Ore', 100)
      expect(price).toBe(100)
    })

    it('should return override price when it exists', () => {
      storage.setPriceOverride('Iron Ore', 200)
      const price = storage.applyPriceOverride('Iron Ore', 100)
      expect(price).toBe(200)
    })

    it('should demonstrate merge strategy: user override wins', () => {
      const basePrice = 100 // From defaults
      const apiPrice = 150 // From API (hypothetical)
      const userPrice = 250 // User override

      storage.setPriceOverride('Iron Ore', userPrice)

      // User override should always win
      expect(storage.applyPriceOverride('Iron Ore', basePrice)).toBe(userPrice)
      expect(storage.applyPriceOverride('Iron Ore', apiPrice)).toBe(userPrice)
    })
  })

  describe('hasPriceOverride', () => {
    it('should return false when no override exists', () => {
      expect(storage.hasPriceOverride('Iron Ore')).toBe(false)
    })

    it('should return true when override exists', () => {
      storage.setPriceOverride('Iron Ore', 100)
      expect(storage.hasPriceOverride('Iron Ore')).toBe(true)
    })

    it('should return false after override is cleared', () => {
      storage.setPriceOverride('Iron Ore', 100)
      storage.clearPriceOverride('Iron Ore')
      expect(storage.hasPriceOverride('Iron Ore')).toBe(false)
    })
  })

  describe('clearAll', () => {
    it('should remove all stored data', () => {
      storage.saveSettings({
        apiKey: 'test-key',
        marketTaxRate: 0.15,
        magicFind: { streak: 5, dungeon: 3, item: 2, bonus: 1 },
      })
      storage.setPriceOverride('Iron Ore', 100)

      storage.clearAll()

      // Should return defaults after clear
      const settings = storage.getSettings()
      expect(settings.apiKey).toBeNull()

      const overrides = storage.getPriceOverrides()
      expect(overrides.size).toBe(0)
    })
  })

  describe('getStorageVersion', () => {
    it('should return current version by default', () => {
      expect(storage.getStorageVersion()).toBe(1)
    })

    it('should return stored version after import', () => {
      const data = {
        version: 1,
        settings: {
          apiKey: null,
          marketTaxRate: 0.12,
          magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
        },
        prices: {},
        overrides: {},
      }

      storage.importAll(JSON.stringify(data))
      expect(storage.getStorageVersion()).toBe(1)
    })
  })

  describe('localStorage key namespacing', () => {
    it('should use correct namespaced keys', () => {
      storage.saveSettings({
        apiKey: 'test',
        marketTaxRate: 0.12,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      })
      storage.setPriceOverride('Iron Ore', 100)

      expect(localStorage.getItem('immo-profit:settings')).toBeTruthy()
      expect(localStorage.getItem('immo-profit:overrides')).toBeTruthy()
    })

    it('should not conflict with other keys', () => {
      localStorage.setItem('other-app:settings', 'other-data')
      storage.saveSettings({
        apiKey: 'test',
        marketTaxRate: 0.12,
        magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
      })

      expect(localStorage.getItem('other-app:settings')).toBe('other-data')
    })
  })

  describe('error handling', () => {
    it('should handle quota exceeded errors gracefully', () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        const error = new DOMException('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      }

      expect(() => {
        storage.saveSettings({
          apiKey: 'test',
          marketTaxRate: 0.12,
          magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 },
        })
      }).toThrow('Storage quota exceeded')

      // Restore
      localStorage.setItem = originalSetItem
    })
  })

  describe('integration: full workflow', () => {
    it('should support complete user workflow', () => {
      // 1. User sets up initial settings
      const initialSettings: AppSettings = {
        apiKey: 'my-api-key',
        marketTaxRate: 0.12,
        magicFind: { streak: 5, dungeon: 3, item: 2, bonus: 1 },
      }
      storage.saveSettings(initialSettings)

      // 2. User overrides some prices
      storage.setPriceOverride('Iron Ore', 150)
      storage.setPriceOverride('Gold Ore', 600)
      storage.setPriceOverride('Health Potion', 50)

      // 3. User updates magic find settings
      storage.setMfSettings({ streak: 10, dungeon: 5, item: 3, bonus: 2 })

      // 4. User exports data
      const exported = storage.exportAll()

      // 5. Simulate fresh install - clear everything
      storage.clearAll()
      expect(storage.getPriceOverrides().size).toBe(0)

      // 6. User imports data
      storage.importAll(exported)

      // 7. Verify everything is restored
      const settings = storage.getSettings()
      expect(settings.apiKey).toBe('my-api-key')
      expect(settings.magicFind.streak).toBe(10)

      const overrides = storage.getPriceOverrides()
      expect(overrides.get('Iron Ore')).toBe(150)
      expect(overrides.get('Gold Ore')).toBe(600)
      expect(overrides.get('Health Potion')).toBe(50)

      // 8. Verify merge strategy
      expect(storage.applyPriceOverride('Iron Ore', 100)).toBe(150)
      expect(storage.applyPriceOverride('Unknown Item', 200)).toBe(200)
    })
  })
})
