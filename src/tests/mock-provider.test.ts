/**
 * Mock Data Provider Tests
 *
 * Tests the mock data layer implementation:
 * - MockProvider returns data from defaults.json
 * - ApiProvider uses API services with fallback
 * - Factory functions create correct provider based on API key
 * - Status indicators work correctly
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MockProvider,
  ApiProvider,
  createDataProvider,
  getDataProvider,
  resetDataProvider,
  getDataProviderStatus,
  type DataProvider,
} from '../api/mock'

describe('MockProvider', () => {
  let provider: DataProvider

  beforeEach(() => {
    provider = new MockProvider()
  })

  it('should report correct status (not using API)', () => {
    const status = provider.getStatus()
    expect(status.isUsingApi).toBe(false)
    expect(status.apiConfigured).toBe(false)
    expect(status.lastApiUpdate).toBe(null)
    expect(status.message).toContain('Using default data')
  })

  it('should return default data for getCurrentPrices', async () => {
    const data = await provider.getCurrentPrices()
    expect(data).toBeDefined()
    expect(data.materials).toBeDefined()
    expect(data.potions).toBeDefined()
    expect(data.resources).toBeDefined()
    expect(Array.isArray(data.materials)).toBe(true)
    expect(data.materials.length).toBeGreaterThan(0)
  })

  it('should find item details by name from defaults', async () => {
    // Test finding a material
    const material = await provider.getItemDetails('Moose antler')
    expect(material).not.toBe(null)
    expect(material?.name).toBe('Moose antler')
    expect(material?.type).toBe('material')

    // Test finding a potion
    const potion = await provider.getItemDetails('Wraithbane')
    expect(potion).not.toBe(null)
    expect(potion?.name).toBe('Wraithbane')
    expect(potion?.type).toBe('potion')

    // Test finding a resource
    const resource = await provider.getItemDetails('Coal')
    expect(resource).not.toBe(null)
    expect(resource?.name).toBe('Coal')
    expect(resource?.type).toBe('resource')
  })

  it('should return null for non-existent items', async () => {
    const item = await provider.getItemDetails('NonExistentItem')
    expect(item).toBe(null)
  })

  it('should search items by query', async () => {
    const results = await provider.searchItems('Moose')
    expect(results.items.length).toBeGreaterThan(0)
    expect(results.items[0].name).toContain('Moose')
  })

  it('should search items by type', async () => {
    const results = await provider.searchItems(undefined, 'material')
    expect(results.items.length).toBeGreaterThan(0)
    results.items.forEach((item) => {
      expect(item.type).toBe('material')
    })
  })

  it('should paginate search results', async () => {
    const page1 = await provider.searchItems()
    const page2 = await provider.searchItems(undefined, undefined, 2)

    expect(page1.pagination.current_page).toBe(1)
    expect(page2.pagination.current_page).toBe(2)

    // Pages should have different data (if enough items)
    if (page1.pagination.total > 25) {
      expect(page1.items[0].name).not.toBe(page2.items[0].name)
    }
  })

  it('should return empty market history', async () => {
    const history = await provider.getMarketHistory('any-id')
    expect(history.history_data).toEqual([])
    expect(history.latest_sold).toEqual([])
    expect(history.type).toBe('listings')
  })

  it('should return null market prices', async () => {
    const prices = await provider.getMarketPrices('any-id')
    expect(prices.buyPrice).toBe(null)
    expect(prices.sellPrice).toBe(null)
  })

  it('should return null average market price', async () => {
    const avg = await provider.getAverageMarketPrice('any-id')
    expect(avg).toBe(null)
  })

  it('should return null for checkAuth', async () => {
    const auth = await provider.checkAuth()
    expect(auth).toBe(null)
  })
})

describe('ApiProvider', () => {
  let provider: DataProvider

  beforeEach(() => {
    // Clear localStorage to ensure no API key is set
    localStorage.clear()
    provider = new ApiProvider()
  })

  it('should report correct status when no API key configured', () => {
    const status = provider.getStatus()
    expect(status.isUsingApi).toBe(false)
    expect(status.apiConfigured).toBe(false)
    expect(status.lastApiUpdate).toBe(null)
    expect(status.message).toContain('Using default data')
  })

  it('should fall back to defaults when no API key configured', async () => {
    const data = await provider.getCurrentPrices()
    expect(data).toBeDefined()
    expect(data.materials).toBeDefined()
    expect(Array.isArray(data.materials)).toBe(true)
  })

  it('should fall back to mock provider for getItemDetails when no API key', async () => {
    const item = await provider.getItemDetails('Moose antler')
    expect(item).not.toBe(null)
    expect(item?.name).toBe('Moose antler')
  })

  it('should use API services for searchItems', async () => {
    // When no API key, services return empty results
    const results = await provider.searchItems('test')
    expect(results).toBeDefined()
    expect(results.items).toBeDefined()
    expect(Array.isArray(results.items)).toBe(true)
  })
})

describe('createDataProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDataProvider()
  })

  it('should create MockProvider when no API key configured', () => {
    const provider = createDataProvider()
    const status = provider.getStatus()
    expect(status.apiConfigured).toBe(false)
    expect(status.isUsingApi).toBe(false)
  })

  it('should create ApiProvider when API key is configured', () => {
    // Set an API key in localStorage
    localStorage.setItem(
      'immo-profit:settings',
      JSON.stringify({ apiKey: 'test-api-key', marketTaxRate: 0.12, magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 } })
    )

    const provider = createDataProvider()
    const status = provider.getStatus()
    expect(status.apiConfigured).toBe(true)
  })
})

describe('getDataProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDataProvider()
  })

  it('should return singleton instance', () => {
    const provider1 = getDataProvider()
    const provider2 = getDataProvider()
    expect(provider1).toBe(provider2)
  })

  it('should return new instance after reset', () => {
    const provider1 = getDataProvider()
    resetDataProvider()
    const provider2 = getDataProvider()
    expect(provider1).not.toBe(provider2)
  })
})

describe('getDataProviderStatus', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDataProvider()
  })

  it('should return correct status without API key', () => {
    const status = getDataProviderStatus()
    expect(status.isUsingApi).toBe(false)
    expect(status.apiConfigured).toBe(false)
    expect(status.message).toContain('Using default data')
  })

  it('should return correct status with API key', () => {
    localStorage.setItem(
      'immo-profit:settings',
      JSON.stringify({ apiKey: 'test-api-key', marketTaxRate: 0.12, magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 } })
    )
    resetDataProvider()

    const status = getDataProviderStatus()
    expect(status.apiConfigured).toBe(true)
  })
})
