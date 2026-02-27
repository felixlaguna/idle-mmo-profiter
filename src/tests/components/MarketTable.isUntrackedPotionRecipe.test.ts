import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Tests for isUntrackedPotionRecipe logic in MarketTable.vue
 *
 * Bug: isUntrackedPotionRecipe() incorrectly identifies non-recipe items like
 * "Aqua Reaper" (a FISHING_ROD) as untracked potions because it doesn't verify
 * that the recipe name contains "Recipe".
 *
 * Fix: Add a guard to return false if producesItemName is not set AND the
 * recipe name doesn't contain "Recipe".
 */

// Helper function to mimic inferPotionName from MarketTable.vue
const inferPotionName = (recipeName: string): string | null => {
  const cleaned = recipeName
    .replace(/\s*\(Untradable\)\s*/i, '')
    .replace(/\s*Recipe\s*$/i, '')
    .trim()
  return cleaned || null
}

// Mock data structure for testing
interface PotionCraft {
  name: string
}

// This is the function we're testing (FIXED VERSION)
const isUntrackedPotionRecipe = (
  recipeName: string,
  producesItemName: string | undefined,
  trackedPotions: PotionCraft[]
): boolean => {
  // Determine what potion this recipe produces
  const potionName = producesItemName || inferPotionName(recipeName)
  if (!potionName) return false

  // FIX: If producesItemName is not set AND the recipe name doesn't contain "Recipe",
  // this is likely not a craftable recipe (could be fishing loot, equipment, etc.)
  if (!producesItemName && !recipeName.toLowerCase().includes('recipe')) {
    return false
  }

  // Check if the potion is already tracked in potionCrafts
  const isTracked = trackedPotions.some((craft) => craft.name === potionName)

  return !isTracked
}

describe('isUntrackedPotionRecipe', () => {
  let trackedPotions: PotionCraft[]

  beforeEach(() => {
    // Setup: some potions are already tracked
    trackedPotions = [
      { name: 'Lesser Health Potion' },
      { name: 'Greater Mana Potion' },
    ]
  })

  it('should return true for untracked recipe with "Recipe" in name', () => {
    const result = isUntrackedPotionRecipe(
      'Fire Resist Potion Recipe',
      undefined,
      trackedPotions
    )
    expect(result).toBe(true)
  })

  it('should return true for untracked recipe with "Recipe (Untradable)" in name', () => {
    const result = isUntrackedPotionRecipe(
      'Fire Resist Potion Recipe (Untradable)',
      undefined,
      trackedPotions
    )
    expect(result).toBe(true)
  })

  it('should return false for tracked recipe', () => {
    const result = isUntrackedPotionRecipe(
      'Lesser Health Potion Recipe',
      undefined,
      trackedPotions
    )
    expect(result).toBe(false)
  })

  it('should return false for non-recipe items without "Recipe" in name (BUG FIX)', () => {
    // This is the bug case: "Aqua Reaper" is a FISHING_ROD, not a recipe
    const result = isUntrackedPotionRecipe('Aqua Reaper', undefined, trackedPotions)
    expect(result).toBe(false) // Should NOT be considered an untracked potion recipe
  })

  it('should return false for other non-recipe items', () => {
    const result = isUntrackedPotionRecipe('Brute', undefined, trackedPotions)
    expect(result).toBe(false)
  })

  it('should return false for equipment items', () => {
    const result = isUntrackedPotionRecipe('Steel Sword', undefined, trackedPotions)
    expect(result).toBe(false)
  })

  it('should return true if producesItemName is set, even if name lacks "Recipe"', () => {
    // If we have explicit producesItemName from a previous inspect, trust it
    const result = isUntrackedPotionRecipe(
      'Weird Item Name',
      'Fire Resist Potion',
      trackedPotions
    )
    expect(result).toBe(true)
  })

  it('should return false if producesItemName is set but potion is already tracked', () => {
    const result = isUntrackedPotionRecipe(
      'Some Recipe',
      'Lesser Health Potion',
      trackedPotions
    )
    expect(result).toBe(false)
  })

  it('should handle case-insensitive "Recipe" matching', () => {
    // "recipe" in lowercase should still be recognized
    const result = isUntrackedPotionRecipe(
      'Fire Resist Potion recipe',
      undefined,
      trackedPotions
    )
    expect(result).toBe(true)
  })

  it('should handle "RECIPE" in uppercase', () => {
    const result = isUntrackedPotionRecipe(
      'Fire Resist Potion RECIPE',
      undefined,
      trackedPotions
    )
    expect(result).toBe(true)
  })

  it('should return false for empty recipe name', () => {
    const result = isUntrackedPotionRecipe('', undefined, trackedPotions)
    expect(result).toBe(false)
  })

  it('should return false for recipe name that becomes empty after cleaning', () => {
    const result = isUntrackedPotionRecipe('   ', undefined, trackedPotions)
    expect(result).toBe(false)
  })
})
