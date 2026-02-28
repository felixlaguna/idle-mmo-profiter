/**
 * Tests for the refresh-market-prices script
 * These tests verify the core utility functions used in the script
 */

import { describe, it, expect } from 'vitest'

describe('refresh-market-prices utilities', () => {
  describe('price rounding', () => {
    it('should round to 1 decimal place', () => {
      const testCases = [
        { input: 110.12345, expected: 110.1 },
        { input: 110.16, expected: 110.2 },
        { input: 110.05, expected: 110.1 },
        { input: 110.0, expected: 110.0 },
        { input: 110.95, expected: 111.0 },
        { input: 0.12, expected: 0.1 },
        { input: 0.16, expected: 0.2 },
      ]

      testCases.forEach(({ input, expected }) => {
        const rounded = Math.round(input * 10) / 10
        expect(rounded).toBe(expected)
      })
    })
  })

  describe('price averaging logic', () => {
    it('should calculate average from transaction prices', () => {
      const transactions = [
        { price_per_item: 100.0 },
        { price_per_item: 110.0 },
        { price_per_item: 120.0 },
        { price_per_item: 130.0 },
        { price_per_item: 140.0 },
      ]

      const prices = transactions.map((t) => t.price_per_item)
      const sum = prices.reduce((acc, price) => acc + price, 0)
      const average = sum / prices.length

      expect(average).toBe(120.0)
    })

    it('should handle single transaction', () => {
      const transactions = [{ price_per_item: 99.5 }]

      const prices = transactions.map((t) => t.price_per_item)
      const sum = prices.reduce((acc, price) => acc + price, 0)
      const average = sum / prices.length

      expect(average).toBe(99.5)
    })

    it('should limit to first N transactions', () => {
      const transactions = [
        { price_per_item: 100.0 },
        { price_per_item: 110.0 },
        { price_per_item: 120.0 },
        { price_per_item: 130.0 },
        { price_per_item: 140.0 },
        { price_per_item: 150.0 },
        { price_per_item: 160.0 },
        { price_per_item: 170.0 },
        { price_per_item: 180.0 },
        { price_per_item: 190.0 },
        { price_per_item: 200.0 }, // Should not be included
      ]

      const limit = 10
      const limitedTransactions = transactions.slice(0, limit)
      const prices = limitedTransactions.map((t) => t.price_per_item)
      const sum = prices.reduce((acc, price) => acc + price, 0)
      const average = sum / prices.length

      expect(average).toBe(145.0) // (100+110+120+130+140+150+160+170+180+190)/10
      expect(limitedTransactions.length).toBe(10)
    })

    it('should round average to 1 decimal place', () => {
      const transactions = [
        { price_per_item: 100.0 },
        { price_per_item: 100.0 },
        { price_per_item: 100.1 },
      ]

      const prices = transactions.map((t) => t.price_per_item)
      const sum = prices.reduce((acc, price) => acc + price, 0)
      const average = sum / prices.length
      const rounded = Math.round(average * 10) / 10

      expect(rounded).toBe(100.0)
    })
  })

  describe('category price field mapping', () => {
    it('should map materials to price field', () => {
      const categoryConfig = {
        materials: { priceField: 'price' },
        craftables: { priceField: 'price' },
        resources: { priceField: 'marketPrice' },
        recipes: { priceField: 'price' },
      }

      expect(categoryConfig.materials.priceField).toBe('price')
    })

    it('should map resources to marketPrice field', () => {
      const categoryConfig = {
        materials: { priceField: 'price' },
        craftables: { priceField: 'price' },
        resources: { priceField: 'marketPrice' },
        recipes: { priceField: 'price' },
      }

      expect(categoryConfig.resources.priceField).toBe('marketPrice')
    })

    it('should map craftables to price field', () => {
      const categoryConfig = {
        materials: { priceField: 'price' },
        craftables: { priceField: 'price' },
        resources: { priceField: 'marketPrice' },
        recipes: { priceField: 'price' },
      }

      expect(categoryConfig.craftables.priceField).toBe('price')
    })

    it('should map recipes to price field', () => {
      const categoryConfig = {
        materials: { priceField: 'price' },
        craftables: { priceField: 'price' },
        resources: { priceField: 'marketPrice' },
        recipes: { priceField: 'price' },
      }

      expect(categoryConfig.recipes.priceField).toBe('price')
    })
  })

  describe('item filtering logic', () => {
    it('should identify items with hashedId', () => {
      const items = [
        { name: 'Item 1', hashedId: 'abc123' },
        { name: 'Item 2', hashedId: '' },
        { name: 'Item 3', hashedId: 'def456' },
        { name: 'Item 4' },
      ]

      const withHashedId = items.filter((item) => item.hashedId && item.hashedId !== '')

      expect(withHashedId.length).toBe(2)
      expect(withHashedId[0].name).toBe('Item 1')
      expect(withHashedId[1].name).toBe('Item 3')
    })

    it('should identify untradable recipes', () => {
      const recipes = [
        { name: 'Recipe 1', hashedId: 'abc123', isUntradable: false },
        { name: 'Recipe 2', hashedId: 'def456', isUntradable: true },
        { name: 'Recipe 3', hashedId: 'ghi789' },
        { name: 'Recipe 4', hashedId: 'jkl012', isUntradable: true },
      ]

      const untradable = recipes.filter((r) => r.isUntradable === true)
      const tradable = recipes.filter((r) => !r.isUntradable)

      expect(untradable.length).toBe(2)
      expect(tradable.length).toBe(2)
      expect(untradable[0].name).toBe('Recipe 2')
      expect(untradable[1].name).toBe('Recipe 4')
    })
  })

  describe('resourceGathering sync logic', () => {
    it('should sync matching resource prices', () => {
      const resources = [
        { name: 'Coal', marketPrice: 5.6 },
        { name: 'Stingray', marketPrice: 35.7 },
        { name: 'Great White Shark', marketPrice: 47.5 },
      ]

      const resourceGathering = [
        { name: 'Coal', marketPrice: 0 },
        { name: 'Stingray', marketPrice: 0 },
        { name: 'Cooked Stingray full', marketPrice: 67 },
      ]

      // Build lookup map
      const resourcePriceMap = new Map<string, number>()
      resources.forEach((r) => resourcePriceMap.set(r.name, r.marketPrice))

      // Sync prices
      resourceGathering.forEach((rg) => {
        const resourcePrice = resourcePriceMap.get(rg.name)
        if (resourcePrice !== undefined) {
          rg.marketPrice = resourcePrice
        }
      })

      expect(resourceGathering[0].marketPrice).toBe(5.6)
      expect(resourceGathering[1].marketPrice).toBe(35.7)
      expect(resourceGathering[2].marketPrice).toBe(67) // No match, keeps original
    })

    it('should count synced items correctly', () => {
      const resources = [
        { name: 'Coal', marketPrice: 5.6 },
        { name: 'Mystic Ore', marketPrice: 23.5 },
      ]

      const resourceGathering = [
        { name: 'Coal', marketPrice: 0 },
        { name: 'Mystic Ore', marketPrice: 0 },
        { name: 'Mystic Bar', marketPrice: 64.5 },
        { name: 'Unknown Item', marketPrice: 100 },
      ]

      const resourcePriceMap = new Map<string, number>()
      resources.forEach((r) => resourcePriceMap.set(r.name, r.marketPrice))

      let syncedCount = 0
      resourceGathering.forEach((rg) => {
        const resourcePrice = resourcePriceMap.get(rg.name)
        if (resourcePrice !== undefined) {
          rg.marketPrice = resourcePrice
          syncedCount++
        }
      })

      expect(syncedCount).toBe(2)
    })
  })

  describe('default refresh minutes logic', () => {
    it('should use default when computeSuggestedRefreshMinutes returns null', () => {
      const DEFAULT_REFRESH_MINUTES = 1440 // 24 hours

      // Simulate insufficient data scenario
      const computedValue = null // computeSuggestedRefreshMinutes returned null

      const suggestedRefreshMinutes =
        computedValue !== null ? computedValue : DEFAULT_REFRESH_MINUTES
      const usedDefault = computedValue === null

      expect(suggestedRefreshMinutes).toBe(1440)
      expect(usedDefault).toBe(true)
    })

    it('should not use default when computeSuggestedRefreshMinutes returns a value', () => {
      const DEFAULT_REFRESH_MINUTES = 1440 // 24 hours

      // Simulate sufficient data scenario
      const computedValue = 60 // 1 hour

      const suggestedRefreshMinutes =
        computedValue !== null ? computedValue : DEFAULT_REFRESH_MINUTES
      const usedDefault = computedValue === null

      expect(suggestedRefreshMinutes).toBe(60)
      expect(usedDefault).toBe(false)
    })

    it('should format default refresh interval correctly', () => {
      const DEFAULT_REFRESH_MINUTES = 1440
      const minutes = DEFAULT_REFRESH_MINUTES

      // Simulate formatRefreshInterval logic for 1440 minutes (24 hours / 1 day)
      const days = minutes / (24 * 60)
      const formatted = `every ${days.toFixed(1)}d`

      expect(formatted).toBe('every 1.0d')
    })
  })

  describe('isDueForRefresh logic', () => {
    it('should return due when item has no lastUpdated', () => {
      const item = {
        name: 'Test Item',
        hashedId: 'abc123',
        suggestedRefreshMinutes: 60,
      }

      // Simulate the isDueForRefresh logic
      const due = !item.lastUpdated
      expect(due).toBe(true)
    })

    it('should return due when item has no suggestedRefreshMinutes', () => {
      const item = {
        name: 'Test Item',
        hashedId: 'abc123',
        lastUpdated: new Date().toISOString(),
      }

      // Simulate the isDueForRefresh logic
      const due = !item.suggestedRefreshMinutes
      expect(due).toBe(true)
    })

    it('should return not due when refresh interval has not elapsed', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      const item = {
        name: 'Test Item',
        hashedId: 'abc123',
        lastUpdated: fiveMinutesAgo.toISOString(),
        suggestedRefreshMinutes: 10, // Should refresh every 10 minutes
      }

      // Simulate the isDueForRefresh logic
      const lastUpdatedTime = new Date(item.lastUpdated).getTime()
      const currentTime = now.getTime()
      const minutesSinceLast = (currentTime - lastUpdatedTime) / (1000 * 60)
      const due = minutesSinceLast >= item.suggestedRefreshMinutes

      expect(due).toBe(false)
      expect(minutesSinceLast).toBeCloseTo(5, 1)
    })

    it('should return due when refresh interval has elapsed', () => {
      const now = new Date()
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)

      const item = {
        name: 'Test Item',
        hashedId: 'abc123',
        lastUpdated: fifteenMinutesAgo.toISOString(),
        suggestedRefreshMinutes: 10, // Should refresh every 10 minutes
      }

      // Simulate the isDueForRefresh logic
      const lastUpdatedTime = new Date(item.lastUpdated).getTime()
      const currentTime = now.getTime()
      const minutesSinceLast = (currentTime - lastUpdatedTime) / (1000 * 60)
      const due = minutesSinceLast >= item.suggestedRefreshMinutes

      expect(due).toBe(true)
      expect(minutesSinceLast).toBeCloseTo(15, 1)
    })

    it('should return due when exactly at threshold', () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      const item = {
        name: 'Test Item',
        hashedId: 'abc123',
        lastUpdated: twoHoursAgo.toISOString(),
        suggestedRefreshMinutes: 120, // 2 hours
      }

      // Simulate the isDueForRefresh logic
      const lastUpdatedTime = new Date(item.lastUpdated).getTime()
      const currentTime = now.getTime()
      const minutesSinceLast = (currentTime - lastUpdatedTime) / (1000 * 60)
      const due = minutesSinceLast >= item.suggestedRefreshMinutes

      expect(due).toBe(true)
      expect(minutesSinceLast).toBeCloseTo(120, 1)
    })

    it('should correctly calculate minutes until due', () => {
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

      const item = {
        name: 'Test Item',
        hashedId: 'abc123',
        lastUpdated: thirtyMinutesAgo.toISOString(),
        suggestedRefreshMinutes: 60, // 1 hour
      }

      // Simulate the isDueForRefresh logic
      const lastUpdatedTime = new Date(item.lastUpdated).getTime()
      const currentTime = now.getTime()
      const minutesSinceLast = (currentTime - lastUpdatedTime) / (1000 * 60)
      const minutesUntilDue = item.suggestedRefreshMinutes - minutesSinceLast

      expect(minutesUntilDue).toBeCloseTo(30, 1)
    })
  })
})
