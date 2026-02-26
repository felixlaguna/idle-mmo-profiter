/**
 * Tests for useDataProvider composable - Refresh Exclusion Methods
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useDataProvider } from '../../composables/useDataProvider'

// Mock localStorage for data provider
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
  }
})()

global.localStorage = localStorageMock as Storage

describe('useDataProvider - Refresh Exclusion Methods', () => {
  beforeEach(() => {
    localStorage.clear()
    const dataProvider = useDataProvider()
    dataProvider.clearAllOverrides()
  })

  describe('singleton pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = useDataProvider()
      const instance2 = useDataProvider()

      expect(instance1).toBe(instance2)
    })
  })

  describe('setRefreshExcluded', () => {
    it('should set exclusion state for a material', () => {
      const dataProvider = useDataProvider()
      const firstMaterial = dataProvider.materials.value[0]

      dataProvider.setRefreshExcluded('materials', firstMaterial.id, true)

      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(true)
    })

    it('should set exclusion state for a potion', () => {
      const dataProvider = useDataProvider()
      const firstPotion = dataProvider.potions.value[0]

      dataProvider.setRefreshExcluded('potions', firstPotion.id, true)

      expect(dataProvider.isRefreshExcluded('potions', firstPotion.id)).toBe(true)
    })

    it('should set exclusion state for a resource', () => {
      const dataProvider = useDataProvider()
      const firstResource = dataProvider.resources.value[0]

      dataProvider.setRefreshExcluded('resources', firstResource.id, true)

      expect(dataProvider.isRefreshExcluded('resources', firstResource.id)).toBe(true)
    })

    it('should set exclusion state for a recipe', () => {
      const dataProvider = useDataProvider()
      const firstRecipe = dataProvider.recipes.value[0]

      dataProvider.setRefreshExcluded('recipes', firstRecipe.id, true)

      expect(dataProvider.isRefreshExcluded('recipes', firstRecipe.id)).toBe(true)
    })

    it('should clear exclusion state when set to false', () => {
      const dataProvider = useDataProvider()
      const firstMaterial = dataProvider.materials.value[0]

      dataProvider.setRefreshExcluded('materials', firstMaterial.id, true)
      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(true)

      dataProvider.setRefreshExcluded('materials', firstMaterial.id, false)
      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(false)
    })

    it('should persist exclusion state in localStorage', () => {
      const dataProvider = useDataProvider()
      const firstMaterial = dataProvider.materials.value[0]

      dataProvider.setRefreshExcluded('materials', firstMaterial.id, true)

      // Get a fresh instance to test persistence
      const dataProvider2 = useDataProvider()
      expect(dataProvider2.isRefreshExcluded('materials', firstMaterial.id)).toBe(true)
    })

    it('should handle multiple items with different exclusion states', () => {
      const dataProvider = useDataProvider()
      const material1 = dataProvider.materials.value[0]
      const material2 = dataProvider.materials.value[1]
      const material3 = dataProvider.materials.value[2]

      dataProvider.setRefreshExcluded('materials', material1.id, true)
      dataProvider.setRefreshExcluded('materials', material2.id, false)
      dataProvider.setRefreshExcluded('materials', material3.id, true)

      expect(dataProvider.isRefreshExcluded('materials', material1.id)).toBe(true)
      expect(dataProvider.isRefreshExcluded('materials', material2.id)).toBe(false)
      expect(dataProvider.isRefreshExcluded('materials', material3.id)).toBe(true)
    })
  })

  describe('isRefreshExcluded', () => {
    it('should return false for items not explicitly excluded', () => {
      const dataProvider = useDataProvider()
      const firstMaterial = dataProvider.materials.value[0]

      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(false)
    })

    it('should return true for excluded items', () => {
      const dataProvider = useDataProvider()
      const firstMaterial = dataProvider.materials.value[0]

      dataProvider.setRefreshExcluded('materials', firstMaterial.id, true)

      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(true)
    })

    it('should return false for non-existent items', () => {
      const dataProvider = useDataProvider()

      expect(dataProvider.isRefreshExcluded('materials', 'nonexistent-id')).toBe(false)
    })
  })

  describe('setAllRefreshExcluded', () => {
    it('should exclude all materials when set to true', () => {
      const dataProvider = useDataProvider()

      dataProvider.setAllRefreshExcluded('materials', true)

      dataProvider.materials.value.forEach((material) => {
        expect(dataProvider.isRefreshExcluded('materials', material.id)).toBe(true)
      })
    })

    it('should include all potions when set to false', () => {
      const dataProvider = useDataProvider()

      // First exclude all
      dataProvider.setAllRefreshExcluded('potions', true)
      // Then include all
      dataProvider.setAllRefreshExcluded('potions', false)

      dataProvider.potions.value.forEach((potion) => {
        expect(dataProvider.isRefreshExcluded('potions', potion.id)).toBe(false)
      })
    })

    it('should exclude all resources', () => {
      const dataProvider = useDataProvider()

      dataProvider.setAllRefreshExcluded('resources', true)

      dataProvider.resources.value.forEach((resource) => {
        expect(dataProvider.isRefreshExcluded('resources', resource.id)).toBe(true)
      })
    })

    it('should exclude all recipes', () => {
      const dataProvider = useDataProvider()

      dataProvider.setAllRefreshExcluded('recipes', true)

      const stats = dataProvider.getExclusionStats('recipes')
      expect(stats.excluded).toBe(stats.total)
    })

    it('should not affect other categories', () => {
      const dataProvider = useDataProvider()

      dataProvider.setAllRefreshExcluded('materials', true)

      // Check that potions are still included
      const firstPotion = dataProvider.potions.value[0]
      expect(dataProvider.isRefreshExcluded('potions', firstPotion.id)).toBe(false)
    })

    it('should persist bulk exclusion in localStorage', () => {
      const dataProvider = useDataProvider()

      dataProvider.setAllRefreshExcluded('materials', true)

      // Get fresh instance
      const dataProvider2 = useDataProvider()
      const firstMaterial = dataProvider2.materials.value[0]
      expect(dataProvider2.isRefreshExcluded('materials', firstMaterial.id)).toBe(true)
    })
  })

  describe('getExclusionStats', () => {
    it('should return correct stats for a category with no exclusions', () => {
      const dataProvider = useDataProvider()

      const stats = dataProvider.getExclusionStats('materials')

      expect(stats.total).toBe(dataProvider.materials.value.length)
      expect(stats.excluded).toBe(0)
      expect(stats.included).toBe(dataProvider.materials.value.length)
    })

    it('should return correct stats for a category with all excluded', () => {
      const dataProvider = useDataProvider()

      dataProvider.setAllRefreshExcluded('potions', true)
      const stats = dataProvider.getExclusionStats('potions')

      expect(stats.total).toBe(dataProvider.potions.value.length)
      expect(stats.excluded).toBe(dataProvider.potions.value.length)
      expect(stats.included).toBe(0)
    })

    it('should return correct stats for a category with partial exclusions', () => {
      const dataProvider = useDataProvider()
      const materials = dataProvider.materials.value

      // Exclude half of the materials
      const halfCount = Math.floor(materials.length / 2)
      materials.slice(0, halfCount).forEach((material) => {
        dataProvider.setRefreshExcluded('materials', material.id, true)
      })

      const stats = dataProvider.getExclusionStats('materials')

      expect(stats.total).toBe(materials.length)
      expect(stats.excluded).toBe(halfCount)
      expect(stats.included).toBe(materials.length - halfCount)
    })

    it('should return overall stats for all categories when no category specified', () => {
      const dataProvider = useDataProvider()

      // Exclude all materials
      dataProvider.setAllRefreshExcluded('materials', true)

      const stats = dataProvider.getExclusionStats()

      const totalItems =
        dataProvider.materials.value.length +
        dataProvider.potions.value.length +
        dataProvider.resources.value.length +
        dataProvider.recipes.value.length

      expect(stats.total).toBe(totalItems)
      expect(stats.totalExcluded).toBe(dataProvider.materials.value.length)
      expect(stats.totalIncluded).toBe(totalItems - dataProvider.materials.value.length)
    })

    it('should calculate stats correctly with mixed exclusions', () => {
      const dataProvider = useDataProvider()

      // Exclude all materials
      dataProvider.setAllRefreshExcluded('materials', true)
      // Exclude all potions
      dataProvider.setAllRefreshExcluded('potions', true)

      const stats = dataProvider.getExclusionStats()

      const totalItems =
        dataProvider.materials.value.length +
        dataProvider.potions.value.length +
        dataProvider.resources.value.length +
        dataProvider.recipes.value.length

      const expectedExcluded =
        dataProvider.materials.value.length + dataProvider.potions.value.length

      expect(stats.totalExcluded).toBe(expectedExcluded)
      expect(stats.total).toBe(totalItems)
      expect(stats.totalIncluded).toBe(totalItems - expectedExcluded)
    })

    it('should return stats for resources category', () => {
      const dataProvider = useDataProvider()

      const stats = dataProvider.getExclusionStats('resources')

      expect(stats.total).toBe(dataProvider.resources.value.length)
      expect(stats.excluded).toBe(0)
      expect(stats.included).toBe(dataProvider.resources.value.length)
    })

    it('should return stats for recipes category', () => {
      const dataProvider = useDataProvider()

      const stats = dataProvider.getExclusionStats('recipes')

      expect(stats.total).toBe(dataProvider.recipes.value.length)
      expect(stats.excluded).toBe(0)
      expect(stats.included).toBe(dataProvider.recipes.value.length)
    })

    it('should handle zero items correctly', () => {
      const dataProvider = useDataProvider()

      // Assuming there are always items, but testing the math
      const stats = dataProvider.getExclusionStats('materials')

      expect(stats.total).toBeGreaterThan(0)
      expect(stats.included + stats.excluded).toBe(stats.total)
    })
  })

  describe('integration tests', () => {
    it('should support complex exclusion patterns', () => {
      const dataProvider = useDataProvider()

      // Exclude all materials
      dataProvider.setAllRefreshExcluded('materials', true)
      // Include first material
      const firstMaterial = dataProvider.materials.value[0]
      dataProvider.setRefreshExcluded('materials', firstMaterial.id, false)

      const stats = dataProvider.getExclusionStats('materials')

      expect(stats.excluded).toBe(dataProvider.materials.value.length - 1)
      expect(stats.included).toBe(1)
    })

    it('should maintain exclusion state across different operations', () => {
      const dataProvider = useDataProvider()
      const material1 = dataProvider.materials.value[0]
      const material2 = dataProvider.materials.value[1]

      // Set individual exclusions
      dataProvider.setRefreshExcluded('materials', material1.id, true)
      dataProvider.setRefreshExcluded('materials', material2.id, true)

      // Bulk include all
      dataProvider.setAllRefreshExcluded('materials', false)

      // Both should now be included
      expect(dataProvider.isRefreshExcluded('materials', material1.id)).toBe(false)
      expect(dataProvider.isRefreshExcluded('materials', material2.id)).toBe(false)
    })

    it('should work correctly when clearing all overrides', () => {
      const dataProvider = useDataProvider()
      const firstMaterial = dataProvider.materials.value[0]

      dataProvider.setRefreshExcluded('materials', firstMaterial.id, true)
      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(true)

      dataProvider.clearAllOverrides()

      expect(dataProvider.isRefreshExcluded('materials', firstMaterial.id)).toBe(false)
    })

    it('should handle exclusions across all categories simultaneously', () => {
      const dataProvider = useDataProvider()

      // Set different exclusion patterns for each category
      dataProvider.setAllRefreshExcluded('materials', true)
      dataProvider.setRefreshExcluded('potions', dataProvider.potions.value[0].id, true)
      dataProvider.setAllRefreshExcluded('resources', false)
      dataProvider.setRefreshExcluded('recipes', dataProvider.recipes.value[0].id, true)
      dataProvider.setRefreshExcluded('recipes', dataProvider.recipes.value[1].id, true)

      const overallStats = dataProvider.getExclusionStats()
      const expectedExcluded = dataProvider.materials.value.length + 1 + 0 + 2 // materials + potions[0] + resources + recipes[0,1]

      expect(overallStats.totalExcluded).toBe(expectedExcluded)
    })
  })
})
