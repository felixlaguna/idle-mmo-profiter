import type { AppSettings, MagicFindSettings } from '../types'

/**
 * Storage version for migration support
 */
const STORAGE_VERSION = 1

/**
 * Namespaced keys for localStorage
 */
const STORAGE_KEYS = {
  VERSION: 'immo-profit:version',
  SETTINGS: 'immo-profit:settings',
  PRICES: 'immo-profit:prices',
  OVERRIDES: 'immo-profit:overrides',
} as const

/**
 * Default settings when no storage exists
 */
const DEFAULT_SETTINGS: AppSettings = {
  apiKey: null,
  marketTaxRate: 0.12,
  magicFind: {
    streak: 0,
    dungeon: 0,
    item: 0,
    bonus: 0,
  },
}

/**
 * Versioned storage schema for migration support
 */
interface StorageSchema {
  version: number
  settings: AppSettings
  prices: Record<string, number>
  overrides: Record<string, number>
}

/**
 * StorageManager handles all localStorage operations with:
 * - Namespaced keys to avoid conflicts
 * - Type-safe methods for settings, prices, and overrides
 * - Merge strategy: default data < API data < user overrides
 * - Migration support for schema changes
 * - Import/export functionality
 */
export class StorageManager {
  /**
   * Get settings from localStorage or return defaults
   */
  getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (stored === null) {
        return { ...DEFAULT_SETTINGS }
      }
      const parsed = JSON.parse(stored) as AppSettings
      // Merge with defaults to handle missing fields after updates
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        magicFind: {
          ...DEFAULT_SETTINGS.magicFind,
          ...parsed.magicFind,
        },
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
      return { ...DEFAULT_SETTINGS }
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: AppSettings): void {
    try {
      const serialized = JSON.stringify(settings)
      localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized)
    } catch (error) {
      this.handleStorageError(error, 'settings')
    }
  }

  /**
   * Get user-edited price overrides
   * Returns a Map for efficient lookups
   */
  getPriceOverrides(): Map<string, number> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OVERRIDES)
      if (stored === null) {
        return new Map()
      }
      const parsed = JSON.parse(stored) as Record<string, number>
      return new Map(Object.entries(parsed))
    } catch (error) {
      console.warn('Failed to load price overrides from localStorage:', error)
      return new Map()
    }
  }

  /**
   * Set a price override for a specific item
   * User overrides always take precedence over API and default data
   */
  setPriceOverride(itemName: string, price: number): void {
    try {
      const overrides = this.getPriceOverrides()
      overrides.set(itemName, price)
      const obj = Object.fromEntries(overrides)
      const serialized = JSON.stringify(obj)
      localStorage.setItem(STORAGE_KEYS.OVERRIDES, serialized)
    } catch (error) {
      this.handleStorageError(error, 'price override')
    }
  }

  /**
   * Clear a price override for a specific item
   * Item will fall back to API or default data
   */
  clearPriceOverride(itemName: string): void {
    try {
      const overrides = this.getPriceOverrides()
      overrides.delete(itemName)
      const obj = Object.fromEntries(overrides)
      const serialized = JSON.stringify(obj)
      localStorage.setItem(STORAGE_KEYS.OVERRIDES, serialized)
    } catch (error) {
      this.handleStorageError(error, 'clear price override')
    }
  }

  /**
   * Clear all price overrides
   * All items will fall back to API or default data
   */
  clearAllOverrides(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.OVERRIDES)
    } catch (error) {
      this.handleStorageError(error, 'clear all overrides')
    }
  }

  /**
   * Get Magic Find settings
   */
  getMfSettings(): MagicFindSettings {
    const settings = this.getSettings()
    return settings.magicFind
  }

  /**
   * Set Magic Find settings
   * Updates only the magicFind portion of settings
   */
  setMfSettings(mf: MagicFindSettings): void {
    const settings = this.getSettings()
    settings.magicFind = mf
    this.saveSettings(settings)
  }

  /**
   * Export all user data as JSON string
   * Includes version for migration support
   */
  exportAll(): string {
    try {
      const settings = this.getSettings()
      const overrides = this.getPriceOverrides()
      const pricesObj = Object.fromEntries(overrides)

      const schema: StorageSchema = {
        version: STORAGE_VERSION,
        settings,
        prices: {}, // Reserved for future use (API-fetched prices cache)
        overrides: pricesObj,
      }

      return JSON.stringify(schema, null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw new Error('Export failed')
    }
  }

  /**
   * Import all user data from JSON string
   * Handles version migration if schema has changed
   */
  importAll(json: string): void {
    try {
      const data = JSON.parse(json) as StorageSchema

      // Validate structure
      if (!data.version || !data.settings) {
        throw new Error('Invalid import data structure')
      }

      // Handle version migration
      const migrated = this.migrateSchema(data)

      // Import settings
      this.saveSettings(migrated.settings)

      // Import overrides
      if (migrated.overrides) {
        const overrides = new Map(Object.entries(migrated.overrides))
        const obj = Object.fromEntries(overrides)
        localStorage.setItem(STORAGE_KEYS.OVERRIDES, JSON.stringify(obj))
      }

      // Store current version
      localStorage.setItem(STORAGE_KEYS.VERSION, String(STORAGE_VERSION))
    } catch (error) {
      console.error('Failed to import data:', error)
      throw new Error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  /**
   * Migrate schema from older versions to current version
   * Handles breaking changes gracefully
   */
  private migrateSchema(data: StorageSchema): StorageSchema {
    let migrated = { ...data }

    // Migration path for version 1 (current version)
    if (data.version < STORAGE_VERSION) {
      // Future migrations will go here
      // Example:
      // if (data.version === 1) {
      //   migrated = this.migrateV1toV2(migrated)
      // }
      console.log(`Migrated from version ${data.version} to ${STORAGE_VERSION}`)
    }

    migrated.version = STORAGE_VERSION
    return migrated
  }

  /**
   * Get the current storage version
   */
  getStorageVersion(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VERSION)
      return stored ? parseInt(stored, 10) : STORAGE_VERSION
    } catch {
      return STORAGE_VERSION
    }
  }

  /**
   * Clear all data from localStorage
   * WARNING: This removes all user data
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS)
      localStorage.removeItem(STORAGE_KEYS.PRICES)
      localStorage.removeItem(STORAGE_KEYS.OVERRIDES)
      localStorage.removeItem(STORAGE_KEYS.VERSION)
    } catch (error) {
      console.error('Failed to clear all data:', error)
    }
  }

  /**
   * Handle storage errors consistently
   */
  private handleStorageError(error: unknown, operation: string): void {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(`localStorage quota exceeded while saving ${operation}`)
      throw new Error('Storage quota exceeded. Please clear some data or reset settings.')
    } else {
      console.error(`Failed to save ${operation} to localStorage:`, error)
      throw new Error(`Failed to save ${operation}`)
    }
  }

  /**
   * Apply merge strategy: default < API < user overrides
   * Given a base price (from defaults or API), apply user override if exists
   */
  applyPriceOverride(itemName: string, basePrice: number): number {
    const overrides = this.getPriceOverrides()
    return overrides.get(itemName) ?? basePrice
  }

  /**
   * Check if an item has a user override
   */
  hasPriceOverride(itemName: string): boolean {
    const overrides = this.getPriceOverrides()
    return overrides.has(itemName)
  }
}

/**
 * Singleton instance for global use
 */
export const storageManager = new StorageManager()
