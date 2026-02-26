/**
 * Storage module - localStorage persistence manager
 *
 * Provides a centralized, type-safe interface for managing user data in localStorage.
 *
 * @example
 * ```typescript
 * import { storageManager } from '@/storage'
 *
 * // Get settings
 * const settings = storageManager.getSettings()
 *
 * // Save settings
 * storageManager.saveSettings({
 *   apiKey: 'my-key',
 *   marketTaxRate: 0.12,
 *   magicFind: { streak: 5, dungeon: 3, item: 2, bonus: 1 }
 * })
 *
 * // Set price override
 * storageManager.setPriceOverride('Iron Ore', 150)
 *
 * // Apply merge strategy (user override wins)
 * const price = storageManager.applyPriceOverride('Iron Ore', 100) // Returns 150
 *
 * // Export all data
 * const json = storageManager.exportAll()
 *
 * // Import data
 * storageManager.importAll(json)
 * ```
 */

export { StorageManager, storageManager } from './persistence'
export type { AppSettings, MagicFindSettings } from '../types'
