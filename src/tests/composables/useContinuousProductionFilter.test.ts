/**
 * Tests for useContinuousProductionFilter composable
 *
 * NOTE: The composable uses a module-level singleton pattern.
 * Each test must explicitly reset state before testing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useContinuousProductionFilter } from '../../composables/useContinuousProductionFilter'

describe('useContinuousProductionFilter', () => {
  // Get the singleton instance and reset state before each test
  const filter = useContinuousProductionFilter()

  beforeEach(async () => {
    // Reset to default (disabled) before each test
    filter.setContinuousProductionEnabled(false)
    await nextTick()
  })

  describe('initial state', () => {
    it('should default to disabled', async () => {
      const { continuousProductionEnabled } = useContinuousProductionFilter()

      await nextTick()

      expect(continuousProductionEnabled.value).toBe(false)
    })
  })

  describe('toggle', () => {
    it('should update enabled state via setter', async () => {
      const { continuousProductionEnabled, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      expect(continuousProductionEnabled.value).toBe(false)

      setContinuousProductionEnabled(true)
      await nextTick()

      expect(continuousProductionEnabled.value).toBe(true)
    })

    it('should be writable as a computed ref', async () => {
      const { continuousProductionEnabled } = useContinuousProductionFilter()

      continuousProductionEnabled.value = true
      await nextTick()

      expect(continuousProductionEnabled.value).toBe(true)
    })
  })

  describe('canHandleContinuousProduction', () => {
    it('should return true for items with undefined weeklySalesVolume (resources)', () => {
      expect(
        filter.canHandleContinuousProduction({
          weeklySalesVolume: undefined,
          timePerAction: 100,
        })
      ).toBe(true)
    })

    it('should return true when market can absorb 24/7 production', () => {
      // 1 second craft time = 604,800 items/week
      // Market sells 700,000/week → passes
      expect(
        filter.canHandleContinuousProduction({
          weeklySalesVolume: 700_000,
          timePerAction: 1,
        })
      ).toBe(true)
    })

    it('should return true when market exactly equals weekly production', () => {
      // 100 seconds per action → 604,800 / 100 = 6,048 items/week
      expect(
        filter.canHandleContinuousProduction({
          weeklySalesVolume: 6_048,
          timePerAction: 100,
        })
      ).toBe(true)
    })

    it('should return false when market cannot absorb 24/7 production', () => {
      // 10 seconds per action → 604,800 / 10 = 60,480 items/week
      // Market sells only 1,000/week → fails
      expect(
        filter.canHandleContinuousProduction({
          weeklySalesVolume: 1_000,
          timePerAction: 10,
        })
      ).toBe(false)
    })

    it('should return false when weeklySalesVolume is 0', () => {
      expect(
        filter.canHandleContinuousProduction({
          weeklySalesVolume: 0,
          timePerAction: 60,
        })
      ).toBe(false)
    })

    it('should handle slow crafts (high timePerAction) with low sales volume', () => {
      // 1 hour craft = 3600s → 168 items/week
      // Market sells 200/week → passes
      expect(
        filter.canHandleContinuousProduction({
          weeklySalesVolume: 200,
          timePerAction: 3600,
        })
      ).toBe(true)
    })
  })

  describe('filterByContinuousProduction', () => {
    it('should return all items when filter is disabled', async () => {
      const { filterByContinuousProduction, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      setContinuousProductionEnabled(false)
      await nextTick()

      const items = [
        { name: 'Slow item', weeklySalesVolume: 5, timePerAction: 100_000 },
        { name: 'Fast item', weeklySalesVolume: 1, timePerAction: 1 },
        { name: 'Resource', timePerAction: 30 },
      ]

      const result = filterByContinuousProduction(items)

      expect(result).toHaveLength(3)
    })

    it('should filter out items that cannot handle 24/7 production when enabled', async () => {
      const { filterByContinuousProduction, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      setContinuousProductionEnabled(true)
      await nextTick()

      const items = [
        // 604,800 / 10 = 60,480 needed; 100,000 sales → passes
        { name: 'High volume', weeklySalesVolume: 100_000, timePerAction: 10 },
        // 604,800 / 10 = 60,480 needed; 1,000 sales → fails
        { name: 'Low volume', weeklySalesVolume: 1_000, timePerAction: 10 },
        // Resource (undefined) → always passes
        { name: 'Resource', timePerAction: 30 },
      ]

      const result = filterByContinuousProduction(items)

      expect(result).toHaveLength(2)
      expect(result.map((i) => i.name)).toEqual(['High volume', 'Resource'])
    })

    it('should pass items at exact production boundary', async () => {
      const { filterByContinuousProduction, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      setContinuousProductionEnabled(true)
      await nextTick()

      // 604,800 / 100 = 6,048 exactly
      const items = [
        { name: 'Exact', weeklySalesVolume: 6_048, timePerAction: 100 },
        { name: 'One less', weeklySalesVolume: 6_047, timePerAction: 100 },
      ]

      const result = filterByContinuousProduction(items)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Exact')
    })

    it('should handle empty array', async () => {
      const { filterByContinuousProduction, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      setContinuousProductionEnabled(true)
      await nextTick()

      expect(filterByContinuousProduction([])).toEqual([])
    })

    it('should filter mixed defined and undefined volumes when enabled', async () => {
      const { filterByContinuousProduction, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      setContinuousProductionEnabled(true)
      await nextTick()

      const items = [
        { name: 'Resource', timePerAction: 30 }, // undefined → passes
        { name: 'Low volume craft', weeklySalesVolume: 5, timePerAction: 100 }, // fails
        { name: 'High volume craft', weeklySalesVolume: 100_000, timePerAction: 100 }, // passes
        { name: 'Another resource', weeklySalesVolume: undefined, timePerAction: 60 }, // passes
      ]

      const result = filterByContinuousProduction(items)

      expect(result).toHaveLength(3)
      expect(result.map((i) => i.name)).toEqual([
        'Resource',
        'High volume craft',
        'Another resource',
      ])
    })
  })

  describe('persistence', () => {
    it('should persist enabled state to localStorage', async () => {
      const { setContinuousProductionEnabled } = useContinuousProductionFilter()

      setContinuousProductionEnabled(true)
      await nextTick()

      const stored = localStorage.getItem('idlemmo:continuous-production-filter')
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed.enabled).toBe(true)
    })
  })

  describe('singleton behavior', () => {
    it('should share state between multiple calls', async () => {
      const instance1 = useContinuousProductionFilter()
      const instance2 = useContinuousProductionFilter()

      instance1.setContinuousProductionEnabled(true)
      await nextTick()

      expect(instance2.continuousProductionEnabled.value).toBe(true)
    })

    it('should maintain consistent filtering across instances', async () => {
      const instance1 = useContinuousProductionFilter()
      const instance2 = useContinuousProductionFilter()

      instance1.setContinuousProductionEnabled(true)
      await nextTick()

      const items = [
        // 604,800 / 100 = 6,048 needed; only 10 → fails
        { name: 'Item 1', weeklySalesVolume: 10, timePerAction: 100 },
        // 604,800 / 100 = 6,048 needed; 100,000 → passes
        { name: 'Item 2', weeklySalesVolume: 100_000, timePerAction: 100 },
      ]

      const result1 = instance1.filterByContinuousProduction(items)
      const result2 = instance2.filterByContinuousProduction(items)

      expect(result1).toEqual(result2)
      expect(result1).toHaveLength(1)
      expect(result1[0].name).toBe('Item 2')
    })
  })

  describe('reactive updates', () => {
    it('should update filtering when toggle changes', async () => {
      const { filterByContinuousProduction, setContinuousProductionEnabled } =
        useContinuousProductionFilter()

      const items = [
        { name: 'Low volume', weeklySalesVolume: 5, timePerAction: 100_000 },
        { name: 'High volume', weeklySalesVolume: 100_000, timePerAction: 100 },
      ]

      // Disabled → all pass
      setContinuousProductionEnabled(false)
      await nextTick()

      let result = filterByContinuousProduction(items)
      expect(result).toHaveLength(2)

      // Enabled → only high volume passes
      setContinuousProductionEnabled(true)
      await nextTick()

      result = filterByContinuousProduction(items)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('High volume')
    })
  })
})
