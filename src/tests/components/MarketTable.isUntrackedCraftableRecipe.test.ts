import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Tests for isUntrackedCraftableRecipe logic in MarketTable.vue
 *
 * Bug: isUntrackedCraftableRecipe() incorrectly identifies non-recipe items like
 * "Aqua Reaper" (a FISHING_ROD) as untracked craftables because it doesn't verify
 * that the recipe name contains "Recipe".
 *
 * Fix: Add a guard to return false if producesItemName is not set AND the
 * recipe name doesn't contain "Recipe".
 */

// Helper function to mimic inferCraftableName from MarketTable.vue
const inferCraftableName = (recipeName: string): string | null => {
  const cleaned = recipeName
    .replace(/\s*\(Untradable\)\s*/i, '')
    .replace(/\s*Recipe\s*$/i, '')
    .trim()
  return cleaned || null
}

// Mock data structure for testing
interface CraftableRecipe {
  name: string
}

// This is the function we're testing (FIXED VERSION)
const isUntrackedCraftableRecipe = (
  recipeName: string,
  producesItemName: string | undefined,
  trackedCraftables: CraftableRecipe[]
): boolean => {
  // Determine what craftable this recipe produces
  const craftableName = producesItemName || inferCraftableName(recipeName)
  if (!craftableName) return false

  // FIX: If producesItemName is not set AND the recipe name doesn't contain "Recipe",
  // this is likely not a craftable recipe (could be fishing loot, equipment, etc.)
  if (!producesItemName && !recipeName.toLowerCase().includes('recipe')) {
    return false
  }

  // Check if the craftable is already tracked
  const isTracked = trackedCraftables.some((craft) => craft.name === craftableName)

  return !isTracked
}

describe('isUntrackedCraftableRecipe', () => {
  let trackedCraftables: CraftableRecipe[]

  beforeEach(() => {
    // Setup: some craftables are already tracked
    trackedCraftables = [{ name: 'Lesser Health Potion' }, { name: 'Greater Mana Potion' }]
  })

  it('should return true for untracked recipe with "Recipe" in name', () => {
    const result = isUntrackedCraftableRecipe(
      'Fire Resist Potion Recipe',
      undefined,
      trackedCraftables
    )
    expect(result).toBe(true)
  })

  it('should return true for untracked recipe with "Recipe (Untradable)" in name', () => {
    const result = isUntrackedCraftableRecipe(
      'Fire Resist Potion Recipe (Untradable)',
      undefined,
      trackedCraftables
    )
    expect(result).toBe(true)
  })

  it('should return false for tracked recipe', () => {
    const result = isUntrackedCraftableRecipe(
      'Lesser Health Potion Recipe',
      undefined,
      trackedCraftables
    )
    expect(result).toBe(false)
  })

  it('should return false for non-recipe items without "Recipe" in name (BUG FIX)', () => {
    // This is the bug case: "Aqua Reaper" is a FISHING_ROD, not a recipe
    const result = isUntrackedCraftableRecipe('Aqua Reaper', undefined, trackedCraftables)
    expect(result).toBe(false) // Should NOT be considered an untracked craftable recipe
  })

  it('should return false for other non-recipe items', () => {
    const result = isUntrackedCraftableRecipe('Brute', undefined, trackedCraftables)
    expect(result).toBe(false)
  })

  it('should return false for equipment items', () => {
    const result = isUntrackedCraftableRecipe('Steel Sword', undefined, trackedCraftables)
    expect(result).toBe(false)
  })

  it('should return true if producesItemName is set, even if name lacks "Recipe"', () => {
    // If we have explicit producesItemName from a previous inspect, trust it
    const result = isUntrackedCraftableRecipe(
      'Weird Item Name',
      'Fire Resist Potion',
      trackedCraftables
    )
    expect(result).toBe(true)
  })

  it('should return false if producesItemName is set but craftable is already tracked', () => {
    const result = isUntrackedCraftableRecipe(
      'Some Recipe',
      'Lesser Health Potion',
      trackedCraftables
    )
    expect(result).toBe(false)
  })

  it('should handle case-insensitive "Recipe" matching', () => {
    // "recipe" in lowercase should still be recognized
    const result = isUntrackedCraftableRecipe(
      'Fire Resist Potion recipe',
      undefined,
      trackedCraftables
    )
    expect(result).toBe(true)
  })

  it('should handle "RECIPE" in uppercase', () => {
    const result = isUntrackedCraftableRecipe(
      'Fire Resist Potion RECIPE',
      undefined,
      trackedCraftables
    )
    expect(result).toBe(true)
  })

  it('should return false for empty recipe name', () => {
    const result = isUntrackedCraftableRecipe('', undefined, trackedCraftables)
    expect(result).toBe(false)
  })

  it('should return false for recipe name that becomes empty after cleaning', () => {
    const result = isUntrackedCraftableRecipe('   ', undefined, trackedCraftables)
    expect(result).toBe(false)
  })
})
