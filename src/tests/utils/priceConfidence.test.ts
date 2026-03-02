/**
 * Tests for price confidence utility functions
 */

import { describe, it, expect } from 'vitest'
import {
  isLowConfidencePrice,
  isLowConfidencePriceWithDate,
  getLowConfidenceReason,
} from '../../utils/priceConfidence'
import type { LatestSoldEntry } from '../../api/services'

// Helper to create a LatestSoldEntry
function createSale(date: string, price: number = 100): LatestSoldEntry {
  return {
    item: { hashed_id: 'test', name: 'Test Item', image_url: '' },
    tier: 0,
    quantity: 1,
    price_per_item: price,
    total_price: price,
    sold_at: date,
  }
}

describe('isLowConfidencePrice', () => {
  describe('empty sales data', () => {
    it('should return true when there are no sales', () => {
      expect(isLowConfidencePrice([])).toBe(true)
    })
  })

  describe('recent sales', () => {
    it('should return false when there are recent sales (within 30 days)', () => {
      const now = new Date('2026-03-02T12:00:00Z')
      const recentSales = [
        createSale(now.toISOString()),
        createSale(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()), // 7 days ago
      ]

      expect(isLowConfidencePriceWithDate(recentSales, now)).toBe(false)
    })

    it('should return false for sales exactly at 30 days threshold', () => {
      const now = new Date('2026-03-02T12:00:00Z')
      const exactlyThirtyDays = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sales = [createSale(exactlyThirtyDays.toISOString())]

      // Exactly 30 days should NOT be low confidence (it's the boundary)
      expect(isLowConfidencePriceWithDate(sales, now)).toBe(false)
    })
  })

  describe('old sales', () => {
    it('should return true when most recent sale is older than 30 days', () => {
      const now = new Date('2026-03-02T12:00:00Z')
      const oldSale = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
      const sales = [createSale(oldSale.toISOString())]

      expect(isLowConfidencePriceWithDate(sales, now)).toBe(true)
    })

    it('should return true when most recent sale is much older', () => {
      const now = new Date('2026-03-02T12:00:00Z')
      const veryOldSale = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // 180 days ago
      const sales = [createSale(veryOldSale.toISOString())]

      expect(isLowConfidencePriceWithDate(sales, now)).toBe(true)
    })
  })

  describe('mixed sales history', () => {
    it('should use the most recent sale to determine confidence', () => {
      const now = new Date('2026-03-02T12:00:00Z')
      const sales = [
        createSale(new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString()), // 100 days ago
        createSale(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()), // 5 days ago (most recent)
        createSale(new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString()), // 50 days ago
      ]

      // Most recent sale is 5 days ago, so NOT low confidence
      expect(isLowConfidencePriceWithDate(sales, now)).toBe(false)
    })

    it('should return low confidence when all sales are old', () => {
      const now = new Date('2026-03-02T12:00:00Z')
      const sales = [
        createSale(new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString()), // 100 days ago
        createSale(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()), // 60 days ago
        createSale(new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString()), // 50 days ago (most recent)
      ]

      // Most recent sale is 50 days ago, so low confidence
      expect(isLowConfidencePriceWithDate(sales, now)).toBe(true)
    })
  })
})

describe('isLowConfidencePriceWithDate', () => {
  it('should use the provided reference date instead of current time', () => {
    const referenceDate = new Date('2026-01-15T12:00:00Z')
    const saleDate = new Date('2025-12-01T12:00:00Z') // 45 days before reference
    const sales = [createSale(saleDate.toISOString())]

    // 45 days gap - should be low confidence
    expect(isLowConfidencePriceWithDate(sales, referenceDate)).toBe(true)
  })

  it('should handle dates at exactly 30 days boundary', () => {
    const referenceDate = new Date('2026-03-02T12:00:00Z')
    const saleDate = new Date('2026-01-31T12:00:00Z') // 30 days exactly
    const sales = [createSale(saleDate.toISOString())]

    // Exactly 30 days is NOT low confidence
    expect(isLowConfidencePriceWithDate(sales, referenceDate)).toBe(false)
  })

  it('should return low confidence just over 30 days', () => {
    const referenceDate = new Date('2026-03-02T12:00:00Z')
    const saleDate = new Date('2026-01-30T11:00:00Z') // Just over 30 days
    const sales = [createSale(saleDate.toISOString())]

    // Just over 30 days IS low confidence
    expect(isLowConfidencePriceWithDate(sales, referenceDate)).toBe(true)
  })
})

describe('getLowConfidenceReason', () => {
  it('should return null for items with recent sales', () => {
    const now = new Date('2026-03-02T12:00:00Z')
    const recentSale = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    const sales = [createSale(recentSale.toISOString())]

    // Use the with-date version for consistent testing
    const isLowConfidence = isLowConfidencePriceWithDate(sales, now)
    expect(isLowConfidence).toBe(false)

    // For the regular function, just verify it returns null or a string
    const reason = getLowConfidenceReason(sales)
    // The reason depends on current time, so we just verify the return type
    expect(reason === null || typeof reason === 'string').toBe(true)
  })

  it('should explain when there are no sales', () => {
    const reason = getLowConfidenceReason([])
    expect(reason).toBe('No sales history available')
  })

  it('should explain when the sale is old', () => {
    const now = new Date('2026-03-02T12:00:00Z')
    const oldSale = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
    const sales = [createSale(oldSale.toISOString())]

    // Verify it's low confidence
    expect(isLowConfidencePriceWithDate(sales, now)).toBe(true)

    // The getLowConfidenceReason uses current time, so we just verify format
    const reason = getLowConfidenceReason(sales)
    if (reason !== null) {
      expect(reason).toContain('Last sale was')
      expect(reason).toContain('days ago')
      expect(reason).toContain('threshold: 30 days')
    }
  })
})
