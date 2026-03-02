/**
 * Tests for useLowConfidenceFilter composable
 *
 * NOTE: The composable uses a module-level singleton pattern.
 * Each test must explicitly reset state before testing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useLowConfidenceFilter } from '../../composables/useLowConfidenceFilter'

describe('useLowConfidenceFilter', () => {
  // Get the singleton instance and reset state before each test
  const filter = useLowConfidenceFilter()

  beforeEach(async () => {
    // Reset both toggles to default (false) before each test
    filter.setShowLowConfidenceCraftables(false)
    filter.setShowLowConfidenceDungeons(false)
    await nextTick()
  })

  describe('initial state', () => {
    it('should have both toggles default to false', async () => {
      const { showLowConfidenceCraftables, showLowConfidenceDungeons } = useLowConfidenceFilter()

      await nextTick()

      expect(showLowConfidenceCraftables.value).toBe(false)
      expect(showLowConfidenceDungeons.value).toBe(false)
    })
  })

  describe('toggle setters', () => {
    it('should update craftables toggle via setter', async () => {
      const { showLowConfidenceCraftables, setShowLowConfidenceCraftables } =
        useLowConfidenceFilter()

      expect(showLowConfidenceCraftables.value).toBe(false)

      setShowLowConfidenceCraftables(true)
      await nextTick()

      expect(showLowConfidenceCraftables.value).toBe(true)
    })

    it('should update dungeons toggle via setter', async () => {
      const { showLowConfidenceDungeons, setShowLowConfidenceDungeons } = useLowConfidenceFilter()

      expect(showLowConfidenceDungeons.value).toBe(false)

      setShowLowConfidenceDungeons(true)
      await nextTick()

      expect(showLowConfidenceDungeons.value).toBe(true)
    })

    it('should allow independent toggle states', async () => {
      const {
        showLowConfidenceCraftables,
        showLowConfidenceDungeons,
        setShowLowConfidenceCraftables,
        setShowLowConfidenceDungeons,
      } = useLowConfidenceFilter()

      // Reset both to ensure clean state
      setShowLowConfidenceCraftables(false)
      setShowLowConfidenceDungeons(false)
      await nextTick()

      setShowLowConfidenceCraftables(true)
      await nextTick()

      expect(showLowConfidenceCraftables.value).toBe(true)
      expect(showLowConfidenceDungeons.value).toBe(false)

      setShowLowConfidenceDungeons(true)
      await nextTick()

      expect(showLowConfidenceCraftables.value).toBe(true)
      expect(showLowConfidenceDungeons.value).toBe(true)
    })
  })

  describe('filterCraftables', () => {
    it('should filter out low-confidence items when toggle is off', async () => {
      const { filterCraftables, setShowLowConfidenceCraftables } = useLowConfidenceFilter()

      setShowLowConfidenceCraftables(false)
      await nextTick()

      const items = [
        { name: 'Item 1', isLowConfidence: false },
        { name: 'Item 2', isLowConfidence: true },
        { name: 'Item 3', isLowConfidence: false },
        { name: 'Item 4', isLowConfidence: true },
      ]

      const result = filterCraftables(items)

      expect(result).toHaveLength(2)
      expect(result.map((i) => i.name)).toEqual(['Item 1', 'Item 3'])
    })

    it('should include all items when toggle is on', async () => {
      const { filterCraftables, setShowLowConfidenceCraftables } = useLowConfidenceFilter()

      setShowLowConfidenceCraftables(true)
      await nextTick()

      const items = [
        { name: 'Item 1', isLowConfidence: false },
        { name: 'Item 2', isLowConfidence: true },
        { name: 'Item 3', isLowConfidence: false },
        { name: 'Item 4', isLowConfidence: true },
      ]

      const result = filterCraftables(items)

      expect(result).toHaveLength(4)
      expect(result.map((i) => i.name)).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4'])
    })

    it('should include items without isLowConfidence field', async () => {
      const { filterCraftables, setShowLowConfidenceCraftables } = useLowConfidenceFilter()

      setShowLowConfidenceCraftables(false)
      await nextTick()

      const items = [
        { name: 'Item 1' }, // No isLowConfidence field (undefined)
        { name: 'Item 2', isLowConfidence: true },
      ]

      const result = filterCraftables(items)

      // Items without isLowConfidence (undefined) should be included
      // because !undefined === true
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Item 1')
    })
  })

  describe('filterDungeons', () => {
    it('should filter out low-confidence dungeons when toggle is off', async () => {
      const { filterDungeons, setShowLowConfidenceDungeons } = useLowConfidenceFilter()

      setShowLowConfidenceDungeons(false)
      await nextTick()

      const items = [
        { name: 'Dungeon 1', isLowConfidence: false },
        { name: 'Dungeon 2', isLowConfidence: true },
        { name: 'Dungeon 3', isLowConfidence: false },
      ]

      const result = filterDungeons(items)

      expect(result).toHaveLength(2)
      expect(result.map((i) => i.name)).toEqual(['Dungeon 1', 'Dungeon 3'])
    })

    it('should include all dungeons when toggle is on', async () => {
      const { filterDungeons, setShowLowConfidenceDungeons } = useLowConfidenceFilter()

      setShowLowConfidenceDungeons(true)
      await nextTick()

      const items = [
        { name: 'Dungeon 1', isLowConfidence: false },
        { name: 'Dungeon 2', isLowConfidence: true },
      ]

      const result = filterDungeons(items)

      expect(result).toHaveLength(2)
    })
  })

  describe('persistence', () => {
    it('should persist state to localStorage', async () => {
      const { setShowLowConfidenceCraftables } = useLowConfidenceFilter()

      setShowLowConfidenceCraftables(true)
      await nextTick()

      // Check that localStorage was updated
      const stored = localStorage.getItem('idlemmo:low-confidence-filter')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed.showLowConfidenceCraftables).toBe(true)
    })
  })

  describe('singleton behavior', () => {
    it('should share state between multiple calls', async () => {
      const instance1 = useLowConfidenceFilter()
      const instance2 = useLowConfidenceFilter()

      instance1.setShowLowConfidenceCraftables(true)
      await nextTick()

      expect(instance2.showLowConfidenceCraftables.value).toBe(true)
    })
  })
})
