import { computed, type Ref } from 'vue'
import { useStorage } from './useStorage'
import type { EfficiencySettings, ResourceSkill, EfficiencyItem } from '../types'

/**
 * Storage key for efficiency settings
 */
const EFFICIENCY_SETTINGS_KEY = 'efficiencySettings'

/**
 * Default efficiency settings (no items equipped)
 */
const DEFAULT_EFFICIENCY_SETTINGS: EfficiencySettings = {
  smelting: null,
  cooking: null,
  woodcutting: null,
  mining: null,
  fishing: null,
}

// Module-level singleton state
const efficiencySettings = useStorage<EfficiencySettings>(
  EFFICIENCY_SETTINGS_KEY,
  DEFAULT_EFFICIENCY_SETTINGS
)

/**
 * Composable for managing Efficiency Item configuration.
 * Persists state to localStorage and provides methods to equip/unequip items.
 *
 * NOTE: This is a TRUE SINGLETON - all calls share the same reactive state.
 *
 * @param efficiencyItems - Optional array of efficiency items from data provider
 */
export function useEfficiencyConfig(efficiencyItems?: Ref<EfficiencyItem[]>) {
  /**
   * Efficiency settings (reactive)
   */
  const settings: Ref<EfficiencySettings> = efficiencySettings

  /**
   * Get the equipped item name for a specific skill
   * @param skill - The resource skill
   * @returns The equipped item name or null if no item is equipped
   */
  function getEquippedItem(skill: ResourceSkill): string | null {
    return settings.value[skill] || null
  }

  /**
   * Equip an efficiency item for a specific skill
   * This replaces any previously equipped item for that skill
   * @param skill - The resource skill
   * @param itemName - The item name to equip
   */
  function equipItem(skill: ResourceSkill, itemName: string): void {
    settings.value = {
      ...settings.value,
      [skill]: itemName,
    }
  }

  /**
   * Unequip the efficiency item for a specific skill
   * @param skill - The resource skill
   */
  function unequipItem(skill: ResourceSkill): void {
    settings.value = {
      ...settings.value,
      [skill]: null,
    }
  }

  /**
   * Check if an item is equipped for a specific skill
   * @param skill - The resource skill
   * @param itemName - The item name to check
   */
  function isItemEquipped(skill: ResourceSkill, itemName: string): boolean {
    return settings.value[skill] === itemName
  }

  /**
   * Clear all equipped items
   */
  function clearAllEquippedItems(): void {
    settings.value = { ...DEFAULT_EFFICIENCY_SETTINGS }
  }

  /**
   * Get all equipped items as an array of [skill, itemName] tuples
   */
  const equippedItems = computed(() => {
    const items: Array<[ResourceSkill, string]> = []
    const skills: ResourceSkill[] = ['smelting', 'cooking', 'woodcutting', 'mining', 'fishing']

    for (const skill of skills) {
      const itemName = settings.value[skill]
      if (itemName) {
        items.push([skill, itemName])
      }
    }

    return items
  })

  /**
   * Count of equipped items
   */
  const equippedItemCount = computed(() => equippedItems.value.length)

  /**
   * Get the total efficiency percentage for a specific skill
   * @param skill - The resource skill
   * @returns Total efficiency percentage (e.g., 5 for 5% efficiency), or 0 if no item equipped
   */
  function getEfficiency(skill: ResourceSkill): number {
    if (!efficiencyItems?.value) return 0

    const itemName = getEquippedItem(skill)
    if (!itemName) return 0

    // Find the equipped item in the efficiency items array
    const item = efficiencyItems.value.find((i) => i.name === itemName)
    if (!item) return 0

    // Find the effect for this skill
    const effect = item.effects.find((e) => e.skill === skill)
    return effect?.efficiencyPercent ?? 0
  }

  /**
   * Apply efficiency modifier to a base craft/gather time
   *
   * Formula from IdleMMO wiki: Final Time = Base Time / ((Efficiency% + 100) / 100)
   * This is equivalent to: Final Time = Base Time * (100 / (100 + Efficiency%))
   *
   * Example: 10s craft time with 5% efficiency:
   * Final Time = 10 / ((5 + 100) / 100) = 10 / 1.05 = 9.52s
   *
   * @param baseTimeSeconds - Base time in seconds (before efficiency)
   * @param skill - The resource skill
   * @returns Modified time in seconds (after efficiency)
   */
  function applyEfficiency(baseTimeSeconds: number, skill: ResourceSkill): number {
    const efficiency = getEfficiency(skill)
    if (efficiency === 0) return baseTimeSeconds

    // Apply formula: Final Time = Base Time / ((Efficiency% + 100) / 100)
    return baseTimeSeconds / ((efficiency + 100) / 100)
  }

  /**
   * Reset all state (for testing)
   * @internal
   */
  function _resetForTesting(): void {
    settings.value = { ...DEFAULT_EFFICIENCY_SETTINGS }
  }

  return {
    // Reactive state
    settings,
    equippedItems,
    equippedItemCount,

    // Methods
    getEquippedItem,
    equipItem,
    unequipItem,
    isItemEquipped,
    clearAllEquippedItems,
    getEfficiency,
    applyEfficiency,

    // Testing only
    _resetForTesting,
  }
}
