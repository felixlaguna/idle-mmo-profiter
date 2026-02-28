/**
 * Tests for refresh frequency utility functions
 */

import { describe, it, expect } from 'vitest'
import { computeSuggestedRefreshMinutes, formatRefreshInterval } from '../../utils/refreshFrequency'
import type { MarketHistoryResponse } from '../../api/services'

describe('computeSuggestedRefreshMinutes', () => {
  describe('high-frequency scenarios (minutes)', () => {
    it('should detect items trading every few minutes with price changes', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 106, // 6% change
            total_price: 106,
            sold_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), // 20 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 112, // ~6% change
            total_price: 112,
            sold_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 119, // ~6% change
            total_price: 119,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // 30 minutes span, 3 meaningful changes = 10 minutes per change
      expect(result).toBe(10)
    })

    it('should handle high-volume stable-price items', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 60 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 101, // 1% change (not meaningful)
            total_price: 101,
            sold_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString(), // 40 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), // 20 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 102, // 2% change (not meaningful)
            total_price: 102,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // 60 minutes span, 4 transactions, no meaningful changes
      // transaction frequency = 60/4 = 15, multiply by 2 = 30
      expect(result).toBe(30)
    })
  })

  describe('medium-frequency scenarios (hours)', () => {
    it('should detect items trading every few hours', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 106, // 6% change
            total_price: 106,
            sold_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 112, // ~6% change
            total_price: 112,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // 12 hours span (720 min), 2 meaningful changes = 360 minutes per change = 6 hours
      expect(result).toBe(360)
    })
  })

  describe('low-frequency scenarios (days)', () => {
    it('should use history_data when latest_sold is insufficient', () => {
      const marketData: MarketHistoryResponse = {
        history_data: [
          {
            date: '2026-02-21T00:00:00Z',
            total_sold: 10,
            average_price: 100,
          },
          {
            date: '2026-02-24T00:00:00Z',
            total_sold: 8,
            average_price: 110, // 10% change
          },
          {
            date: '2026-02-27T00:00:00Z',
            total_sold: 12,
            average_price: 121, // 10% change
          },
        ],
        latest_sold: [], // No recent sales
        type: 'listings',
        endpoint_updates_at: new Date().toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // 6 days span, 2 meaningful changes = 3 days per change = 4320 minutes
      expect(result).toBe(4320)
    })

    it('should use history_data for stable items over many days', () => {
      const marketData: MarketHistoryResponse = {
        history_data: [
          {
            date: '2026-02-01T00:00:00Z',
            total_sold: 5,
            average_price: 100,
          },
          {
            date: '2026-02-08T00:00:00Z',
            total_sold: 3,
            average_price: 102, // 2% change (not meaningful)
          },
          {
            date: '2026-02-15T00:00:00Z',
            total_sold: 4,
            average_price: 101,
          },
          {
            date: '2026-02-22T00:00:00Z',
            total_sold: 6,
            average_price: 103, // 2% change (not meaningful)
          },
        ],
        latest_sold: [],
        type: 'listings',
        endpoint_updates_at: new Date().toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // 21 days span, 4 entries, no meaningful changes
      // entry frequency = 21/4 = 5.25 days, multiply by 2 = 10.5 days = 15120 minutes
      expect(result).toBe(15120)
    })
  })

  describe('combining signals', () => {
    it('should take minimum when both sources provide data', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [
          {
            date: '2026-02-21T00:00:00Z',
            total_sold: 10,
            average_price: 100,
          },
          {
            date: '2026-02-28T00:00:00Z',
            total_sold: 8,
            average_price: 120, // 20% change
          },
        ],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 106, // 6% change
            total_price: 106,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // latest_sold: 30 minutes / 1 change = 30 minutes
      // history_data: 7 days / 1 change = 10080 minutes
      // Take minimum: 30 minutes
      expect(result).toBe(30)
    })
  })

  describe('edge cases', () => {
    it('should return null when no data available', () => {
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [],
        type: 'listings',
        endpoint_updates_at: new Date().toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      expect(result).toBeNull()
    })

    it('should return null when only single entry available', () => {
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date().toISOString(),
          },
        ],
        type: 'listings',
        endpoint_updates_at: new Date().toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      expect(result).toBeNull()
    })

    it('should clamp to minimum of 5 minutes', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 10 * 1000).toISOString(), // 10 seconds ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 110, // 10% change
            total_price: 110,
            sold_at: new Date(now.getTime() - 5 * 1000).toISOString(), // 5 seconds ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 121, // 10% change
            total_price: 121,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // Would compute very small interval, but should clamp to 5
      expect(result).toBe(5)
    })

    it('should clamp to maximum of 43200 minutes (30 days)', () => {
      const marketData: MarketHistoryResponse = {
        history_data: [
          {
            date: '2025-12-01T00:00:00Z',
            total_sold: 1,
            average_price: 100,
          },
          {
            date: '2026-02-28T00:00:00Z',
            total_sold: 1,
            average_price: 100, // No change, very rare item
          },
        ],
        latest_sold: [],
        type: 'listings',
        endpoint_updates_at: new Date().toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // Would compute very large interval (months), but should clamp to 43200 (30 days)
      expect(result).toBe(43200)
    })

    it('should handle 5% threshold boundary exactly', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 60 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 105, // Exactly 5% change
            total_price: 105,
            sold_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 min ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 110.25, // 5% change from 105
            total_price: 110.25,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // 60 minutes span, 2 changes = 30 minutes per change
      expect(result).toBe(30)
    })

    it('should return null when time span is too short', () => {
      const now = new Date('2026-02-28T12:00:00Z')
      const marketData: MarketHistoryResponse = {
        history_data: [],
        latest_sold: [
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: new Date(now.getTime() - 500).toISOString(), // 0.5 seconds ago
          },
          {
            item: { hashed_id: 'abc', name: 'Item', image_url: '' },
            tier: 0,
            quantity: 1,
            price_per_item: 100,
            total_price: 100,
            sold_at: now.toISOString(), // now
          },
        ],
        type: 'listings',
        endpoint_updates_at: now.toISOString(),
      }

      const result = computeSuggestedRefreshMinutes(marketData)
      // Span < 1 second, should return null (data not representative)
      expect(result).toBeNull()
    })
  })
})

describe('formatRefreshInterval', () => {
  it('should format minutes correctly', () => {
    expect(formatRefreshInterval(5)).toBe('every 5 min')
    expect(formatRefreshInterval(15)).toBe('every 15 min')
    expect(formatRefreshInterval(45)).toBe('every 45 min')
  })

  it('should format hours correctly', () => {
    expect(formatRefreshInterval(60)).toBe('every 1.0h')
    expect(formatRefreshInterval(90)).toBe('every 1.5h')
    expect(formatRefreshInterval(150)).toBe('every 2.5h')
    expect(formatRefreshInterval(360)).toBe('every 6.0h')
    expect(formatRefreshInterval(1200)).toBe('every 20.0h')
  })

  it('should format days correctly', () => {
    expect(formatRefreshInterval(1440)).toBe('every 1.0d')
    expect(formatRefreshInterval(2160)).toBe('every 1.5d')
    expect(formatRefreshInterval(4320)).toBe('every 3.0d')
    expect(formatRefreshInterval(10080)).toBe('every 7.0d')
    expect(formatRefreshInterval(43200)).toBe('every 30.0d')
  })

  it('should round minutes to whole numbers', () => {
    expect(formatRefreshInterval(7.8)).toBe('every 8 min')
    expect(formatRefreshInterval(12.3)).toBe('every 12 min')
  })
})
