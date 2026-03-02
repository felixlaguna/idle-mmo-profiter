import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useActivityFilters } from '../../composables/useActivityFilters'
import { useLowConfidenceFilter } from '../../composables/useLowConfidenceFilter'
import type { RankedActivity } from '../../calculators/profitRanker'

describe('useActivityFilters', () => {
  // Reset localStorage before each test
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getFilteredActivities', () => {
    it('should filter by activity type', async () => {
      const { filterDungeons, filterCraftables, filterResources, getFilteredActivities } =
        useActivityFilters()

      // Set up low-confidence to show all (so it doesn't affect filtering)
      const { setShowLowConfidenceCraftables, setShowLowConfidenceDungeons } =
        useLowConfidenceFilter()
      setShowLowConfidenceCraftables(true)
      setShowLowConfidenceDungeons(true)
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'dungeon',
          name: 'Dungeon 1',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test dungeon',
          isRecommended: true,
        },
        {
          rank: 2,
          activityType: 'craftable',
          name: 'Craftable 1',
          profitPerHour: 800,
          profitPerAction: 80,
          timePerAction: 360,
          cost: 40,
          details: 'Test craftable',
          isRecommended: false,
        },
        {
          rank: 3,
          activityType: 'resource',
          name: 'Resource 1',
          profitPerHour: 600,
          profitPerAction: 60,
          timePerAction: 360,
          cost: 30,
          details: 'Test resource',
          isRecommended: false,
        },
      ]

      // All filters on (default)
      filterDungeons.value = true
      filterCraftables.value = true
      filterResources.value = true
      await nextTick()

      let filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(3)

      // Turn off dungeons
      filterDungeons.value = false
      await nextTick()
      filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(2)
      expect(filtered.map((a) => a.activityType)).toEqual(['craftable', 'resource'])

      // Turn off craftables
      filterCraftables.value = false
      await nextTick()
      filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].activityType).toBe('resource')

      // Turn off resources
      filterResources.value = false
      await nextTick()
      filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(0)
    })

    it('should filter low-confidence craftables when toggle is off', async () => {
      const { filterCraftables, getFilteredActivities } = useActivityFilters()
      const { setShowLowConfidenceCraftables } = useLowConfidenceFilter()

      // Enable craftables filter
      filterCraftables.value = true
      // Disable low-confidence craftables
      setShowLowConfidenceCraftables(false)
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'craftable',
          name: 'High Confidence Craftable',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test craftable',
          isRecommended: true,
          isLowConfidence: false,
        },
        {
          rank: 2,
          activityType: 'craftable',
          name: 'Low Confidence Craftable',
          profitPerHour: 900,
          profitPerAction: 90,
          timePerAction: 360,
          cost: 45,
          details: 'Test craftable',
          isRecommended: false,
          isLowConfidence: true,
        },
        {
          rank: 3,
          activityType: 'craftable',
          name: 'Another High Confidence Craftable',
          profitPerHour: 800,
          profitPerAction: 80,
          timePerAction: 360,
          cost: 40,
          details: 'Test craftable',
          isRecommended: false,
          isLowConfidence: false,
        },
      ]

      const filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(2)
      expect(filtered.map((a) => a.name)).toEqual([
        'High Confidence Craftable',
        'Another High Confidence Craftable',
      ])
    })

    it('should filter low-confidence dungeons when toggle is off', async () => {
      const { filterDungeons, getFilteredActivities } = useActivityFilters()
      const { setShowLowConfidenceDungeons } = useLowConfidenceFilter()

      // Enable dungeons filter
      filterDungeons.value = true
      // Disable low-confidence dungeons
      setShowLowConfidenceDungeons(false)
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'dungeon',
          name: 'High Confidence Dungeon',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test dungeon',
          isRecommended: true,
          isLowConfidence: false,
        },
        {
          rank: 2,
          activityType: 'dungeon',
          name: 'Low Confidence Dungeon',
          profitPerHour: 900,
          profitPerAction: 90,
          timePerAction: 360,
          cost: 45,
          details: 'Test dungeon',
          isRecommended: false,
          isLowConfidence: true,
        },
      ]

      const filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('High Confidence Dungeon')
    })

    it('should include low-confidence items when toggle is on', async () => {
      const { filterDungeons, filterCraftables, getFilteredActivities } = useActivityFilters()
      const { setShowLowConfidenceCraftables, setShowLowConfidenceDungeons } =
        useLowConfidenceFilter()

      // Enable all filters
      filterDungeons.value = true
      filterCraftables.value = true
      // Enable low-confidence items
      setShowLowConfidenceCraftables(true)
      setShowLowConfidenceDungeons(true)
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'dungeon',
          name: 'Low Confidence Dungeon',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test dungeon',
          isRecommended: true,
          isLowConfidence: true,
        },
        {
          rank: 2,
          activityType: 'craftable',
          name: 'Low Confidence Craftable',
          profitPerHour: 900,
          profitPerAction: 90,
          timePerAction: 360,
          cost: 45,
          details: 'Test craftable',
          isRecommended: false,
          isLowConfidence: true,
        },
      ]

      const filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(2)
    })

    it('should not filter resources by low-confidence (resources have no low-confidence flag)', async () => {
      const { filterResources, getFilteredActivities } = useActivityFilters()

      filterResources.value = true
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'resource',
          name: 'Resource 1',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test resource',
          isRecommended: true,
          // Resources don't have isLowConfidence
        },
        {
          rank: 2,
          activityType: 'resource',
          name: 'Resource 2',
          profitPerHour: 900,
          profitPerAction: 90,
          timePerAction: 360,
          cost: 45,
          details: 'Test resource',
          isRecommended: false,
          isLowConfidence: true, // Even if somehow set, shouldn't affect resources
        },
      ]

      const filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(2)
    })

    it('should combine activity type and low-confidence filters', async () => {
      const { filterDungeons, filterCraftables, getFilteredActivities } = useActivityFilters()
      const { setShowLowConfidenceCraftables, setShowLowConfidenceDungeons } =
        useLowConfidenceFilter()

      filterDungeons.value = true
      filterCraftables.value = true
      setShowLowConfidenceCraftables(false)
      setShowLowConfidenceDungeons(false)
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'dungeon',
          name: 'Low Confidence Dungeon',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test',
          isRecommended: true,
          isLowConfidence: true,
        },
        {
          rank: 2,
          activityType: 'craftable',
          name: 'Low Confidence Craftable',
          profitPerHour: 900,
          profitPerAction: 90,
          timePerAction: 360,
          cost: 45,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: true,
        },
        {
          rank: 3,
          activityType: 'dungeon',
          name: 'High Confidence Dungeon',
          profitPerHour: 800,
          profitPerAction: 80,
          timePerAction: 360,
          cost: 40,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: false,
        },
        {
          rank: 4,
          activityType: 'craftable',
          name: 'High Confidence Craftable',
          profitPerHour: 700,
          profitPerAction: 70,
          timePerAction: 360,
          cost: 35,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: false,
        },
      ]

      const filtered = getFilteredActivities(activities)
      expect(filtered).toHaveLength(2)
      expect(filtered.map((a) => a.name)).toEqual(['High Confidence Dungeon', 'High Confidence Craftable'])
    })
  })

  describe('getFilteredAndRerankedActivities', () => {
    it('should re-rank filtered activities starting from 1', async () => {
      const { filterDungeons, getFilteredAndRerankedActivities } = useActivityFilters()
      const { setShowLowConfidenceDungeons } = useLowConfidenceFilter()

      filterDungeons.value = true
      setShowLowConfidenceDungeons(false)
      await nextTick()

      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'dungeon',
          name: 'Low Confidence Dungeon',
          profitPerHour: 1000,
          profitPerAction: 100,
          timePerAction: 360,
          cost: 50,
          details: 'Test',
          isRecommended: true,
          isLowConfidence: true,
        },
        {
          rank: 2,
          activityType: 'dungeon',
          name: 'High Confidence Dungeon',
          profitPerHour: 800,
          profitPerAction: 80,
          timePerAction: 360,
          cost: 40,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: false,
        },
        {
          rank: 3,
          activityType: 'dungeon',
          name: 'Another High Confidence Dungeon',
          profitPerHour: 600,
          profitPerAction: 60,
          timePerAction: 360,
          cost: 30,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: false,
        },
      ]

      const filtered = getFilteredAndRerankedActivities(activities)
      expect(filtered).toHaveLength(2)
      // Ranks should be re-assigned after filtering out low-confidence
      expect(filtered[0].rank).toBe(1)
      expect(filtered[0].name).toBe('High Confidence Dungeon')
      expect(filtered[1].rank).toBe(2)
      expect(filtered[1].name).toBe('Another High Confidence Dungeon')
    })

    it('should ensure low-confidence items do not appear at top ranks when toggles are off', async () => {
      const { filterDungeons, filterCraftables, getFilteredAndRerankedActivities } =
        useActivityFilters()
      const { setShowLowConfidenceCraftables, setShowLowConfidenceDungeons } =
        useLowConfidenceFilter()

      filterDungeons.value = true
      filterCraftables.value = true
      setShowLowConfidenceCraftables(false)
      setShowLowConfidenceDungeons(false)
      await nextTick()

      // Low-confidence items have HIGHER profit but should be excluded
      const activities: RankedActivity[] = [
        {
          rank: 1,
          activityType: 'dungeon',
          name: 'Very Profitable Low Confidence Dungeon',
          profitPerHour: 10000,
          profitPerAction: 1000,
          timePerAction: 360,
          cost: 50,
          details: 'Test',
          isRecommended: true,
          isLowConfidence: true,
        },
        {
          rank: 2,
          activityType: 'craftable',
          name: 'Very Profitable Low Confidence Craftable',
          profitPerHour: 9000,
          profitPerAction: 900,
          timePerAction: 360,
          cost: 45,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: true,
        },
        {
          rank: 3,
          activityType: 'dungeon',
          name: 'High Confidence Dungeon',
          profitPerHour: 800,
          profitPerAction: 80,
          timePerAction: 360,
          cost: 40,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: false,
        },
        {
          rank: 4,
          activityType: 'craftable',
          name: 'High Confidence Craftable',
          profitPerHour: 700,
          profitPerAction: 70,
          timePerAction: 360,
          cost: 35,
          details: 'Test',
          isRecommended: false,
          isLowConfidence: false,
        },
      ]

      const filtered = getFilteredAndRerankedActivities(activities)

      // Low-confidence items should be filtered out
      expect(filtered).toHaveLength(2)

      // The rank 1 item should NOT be the low-confidence one
      expect(filtered[0].rank).toBe(1)
      expect(filtered[0].name).toBe('High Confidence Dungeon')
      expect(filtered[0].isLowConfidence).toBeFalsy()

      expect(filtered[1].rank).toBe(2)
      expect(filtered[1].name).toBe('High Confidence Craftable')
      expect(filtered[1].isLowConfidence).toBeFalsy()
    })
  })
})
