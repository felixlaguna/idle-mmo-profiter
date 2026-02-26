/**
 * API service methods for IdleMMO items and market data
 *
 * All methods:
 * 1. Check if API key is configured (if not, return default data)
 * 2. Check cache first
 * 3. If cache miss, make API request through rate-limited client
 * 4. Cache the response before returning
 * 5. If API request fails, fall back to default data
 */

import { apiClient } from './client'
import { get, set, generateCacheKey } from './cache'
import type { AuthCheckResponse } from '../types'

/**
 * API response types based on IdleMMO API documentation
 */

export interface ItemSearchResult {
  hashed_item_id: string
  item_id: number
  name: string
  description: string
  type: string
  image: string
  item_tier: number
  item_category: string
}

export interface ItemSearchResponse {
  data: ItemSearchResult[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number
    last_page: number
    path: string
    per_page: number
    to: number
    total: number
  }
}

export interface ItemRecipe {
  recipe_id: number
  recipe_hashed_id: string
  name: string
  description: string
  image: string
  tags: string[]
  success_rate: number
  tradeable: boolean
  sellable: boolean
  level_required: number
  skill: string
  experience_awarded: number
  crafting_time: number
  ingredients: Array<{
    hashed_item_id: string
    item_id: number
    name: string
    quantity: number
    image: string
  }>
}

export interface ItemDetails {
  hashed_item_id: string
  item_id: number
  name: string
  description: string
  type: string
  image: string
  item_tier: number
  item_category: string
  tradeable: boolean
  sellable: boolean
  level_required: number
  skill: string | null
  price: number
  recipes?: ItemRecipe[]
}

export interface MarketHistoryEntry {
  id: number
  price: number
  quantity: number
  type: 'buy' | 'sell'
  created_at: string
  updated_at: string
}

export interface MarketListing {
  id: number
  character_id: number
  character_name: string
  price: number
  quantity: number
  created_at: string
  updated_at: string
}

export interface MarketHistoryResponse {
  history: MarketHistoryEntry[]
  buy_orders: MarketListing[]
  sell_orders: MarketListing[]
}

/**
 * Default/empty responses when API is not configured or fails
 */

const EMPTY_SEARCH_RESPONSE: ItemSearchResponse = {
  data: [],
  links: {
    first: '',
    last: '',
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    from: 0,
    last_page: 1,
    path: '',
    per_page: 25,
    to: 0,
    total: 0,
  },
}

const EMPTY_MARKET_HISTORY: MarketHistoryResponse = {
  history: [],
  buy_orders: [],
  sell_orders: [],
}

/**
 * Search for items by name or type
 *
 * @param query - Optional search query (item name)
 * @param type - Optional item type filter
 * @param page - Page number (default: 1)
 * @returns Item search results with pagination
 */
export async function searchItems(
  query?: string,
  type?: string,
  page = 1
): Promise<ItemSearchResponse> {
  // Check if API key is configured
  if (!apiClient.isConfigured()) {
    console.log('API key not configured, returning empty search results')
    return EMPTY_SEARCH_RESPONSE
  }

  // Build params object (only include defined params)
  const params: Record<string, string | number> = { page }
  if (query) params.query = query
  if (type) params.type = type

  // Build cache key from URL + params
  const cacheKey = generateCacheKey('/item/search', params)

  // Check cache first
  const cached = get<ItemSearchResponse>(cacheKey)
  if (cached) {
    console.log(`Cache hit for item search: ${query || type || 'all'} (page ${page})`)
    return cached
  }

  // Cache miss - make API request
  console.log(`Cache miss for item search: ${query || type || 'all'} (page ${page}), fetching from API`)

  try {
    const data = await apiClient.get<ItemSearchResponse>('/item/search', params)

    // Cache the result
    set(cacheKey, data)

    return data
  } catch (error) {
    console.error('Failed to search items, returning empty results:', error)
    return EMPTY_SEARCH_RESPONSE
  }
}

/**
 * Get detailed information about a specific item (inspect endpoint)
 *
 * @param hashedItemId - The hashed item ID
 * @returns Detailed item information including recipes, stats, and vendor price
 */
export async function inspectItem(
  hashedItemId: string
): Promise<ItemDetails | null> {
  // Check if API key is configured
  if (!apiClient.isConfigured()) {
    console.log('API key not configured, cannot inspect item')
    return null
  }

  // Build cache key from URL
  const cacheKey = generateCacheKey(`/item/${hashedItemId}/inspect`)

  // Check cache first
  const cached = get<ItemDetails>(cacheKey)
  if (cached) {
    console.log(`Cache hit for item details: ${hashedItemId}`)
    return cached
  }

  // Cache miss - make API request
  console.log(`Cache miss for item details: ${hashedItemId}, fetching from API`)

  try {
    const data = await apiClient.get<ItemDetails>(
      `/item/${hashedItemId}/inspect`
    )

    // Cache the result
    set(cacheKey, data)

    return data
  } catch (error) {
    console.error('Failed to inspect item, returning null:', error)
    return null
  }
}

/**
 * Alias for inspectItem - kept for backwards compatibility
 */
export async function getItemDetails(
  hashedItemId: string
): Promise<ItemDetails | null> {
  return inspectItem(hashedItemId)
}

/**
 * Get market history and current listings for an item
 *
 * @param hashedItemId - The hashed item ID
 * @param tier - Optional item tier filter
 * @param type - Optional listing type filter ('listings' or 'orders')
 * @returns Market history, buy orders, and sell orders
 */
export async function getMarketHistory(
  hashedItemId: string,
  tier?: number,
  type?: 'listings' | 'orders'
): Promise<MarketHistoryResponse> {
  // Check if API key is configured
  if (!apiClient.isConfigured()) {
    console.log('API key not configured, returning empty market history')
    return EMPTY_MARKET_HISTORY
  }

  // Build params object (only include defined params)
  const params: Record<string, string | number> = {}
  if (tier !== undefined) params.tier = tier
  if (type) params.type = type

  // Build cache key from URL + params
  const cacheKey = generateCacheKey(
    `/item/${hashedItemId}/market-history`,
    Object.keys(params).length > 0 ? params : undefined
  )

  // Check cache first
  const cached = get<MarketHistoryResponse>(cacheKey)
  if (cached) {
    console.log(`Cache hit for market history: ${hashedItemId}`)
    return cached
  }

  // Cache miss - make API request
  console.log(`Cache miss for market history: ${hashedItemId}, fetching from API`)

  try {
    const data = await apiClient.get<MarketHistoryResponse>(
      `/item/${hashedItemId}/market-history`,
      Object.keys(params).length > 0 ? params : undefined
    )

    // Cache the result (TTL automatically inferred as 1 hour for market-history)
    set(cacheKey, data)

    return data
  } catch (error) {
    console.error('Failed to get market history, returning empty data:', error)
    return EMPTY_MARKET_HISTORY
  }
}

/**
 * Get the current best buy and sell prices from market data
 *
 * @param hashedItemId - The hashed item ID
 * @param tier - Optional item tier filter
 * @returns Object with best buy and sell prices, or null if no data
 */
export async function getMarketPrices(
  hashedItemId: string,
  tier?: number
): Promise<{ buyPrice: number | null; sellPrice: number | null }> {
  const marketData = await getMarketHistory(hashedItemId, tier)

  // Get lowest sell order (what you can buy at)
  const buyPrice =
    marketData.sell_orders.length > 0
      ? Math.min(...marketData.sell_orders.map((order) => order.price))
      : null

  // Get highest buy order (what you can sell at)
  const sellPrice =
    marketData.buy_orders.length > 0
      ? Math.max(...marketData.buy_orders.map((order) => order.price))
      : null

  return { buyPrice, sellPrice }
}

/**
 * Get average market price from recent history
 *
 * @param hashedItemId - The hashed item ID
 * @param limit - Number of recent transactions to average (default: 10)
 * @param tier - Optional item tier filter
 * @returns Average price or null if no data
 */
export async function getAverageMarketPrice(
  hashedItemId: string,
  limit = 10,
  tier?: number
): Promise<number | null> {
  const marketData = await getMarketHistory(hashedItemId, tier)

  if (marketData.history.length === 0) {
    return null
  }

  // Get most recent transactions
  const recentTransactions = marketData.history
    .slice(0, limit)
    .map((entry) => entry.price)

  if (recentTransactions.length === 0) {
    return null
  }

  // Calculate average
  const sum = recentTransactions.reduce((acc, price) => acc + price, 0)
  return sum / recentTransactions.length
}

/**
 * Batch search for multiple items
 * Uses the client's queue to automatically rate-limit requests
 *
 * @param queries - Array of search queries
 * @param type - Optional item type filter
 * @returns Array of search results
 */
export async function batchSearchItems(
  queries: string[],
  type?: string
): Promise<ItemSearchResponse[]> {
  console.log(`Batch searching ${queries.length} items`)

  const promises = queries.map((query) => searchItems(query, type))

  return await Promise.all(promises)
}

/**
 * Batch get item details for multiple items
 * Uses the client's queue to automatically rate-limit requests
 *
 * @param hashedItemIds - Array of hashed item IDs
 * @returns Array of item details (null entries for failed requests)
 */
export async function batchGetItemDetails(
  hashedItemIds: string[]
): Promise<(ItemDetails | null)[]> {
  console.log(`Batch fetching details for ${hashedItemIds.length} items`)

  const promises = hashedItemIds.map((id) => getItemDetails(id))

  return await Promise.all(promises)
}

/**
 * Check authentication status and get API key information
 *
 * @returns API key information including name, scopes, and rate limit
 * @returns null if API key is not configured or authentication fails
 */
export async function checkAuth(): Promise<AuthCheckResponse | null> {
  // Check if API key is configured
  if (!apiClient.isConfigured()) {
    console.log('API key not configured, cannot check auth')
    return null
  }

  // Build cache key
  const cacheKey = generateCacheKey('/auth/check')

  // Check cache first (with short TTL for auth checks)
  const cached = get<AuthCheckResponse>(cacheKey)
  if (cached) {
    console.log('Cache hit for auth check')
    return cached
  }

  // Cache miss - make API request
  console.log('Cache miss for auth check, fetching from API')

  try {
    const data = await apiClient.get<AuthCheckResponse>('/auth/check')

    // Cache the result (5 minute TTL for auth info)
    set(cacheKey, data, 5 * 60 * 1000)

    return data
  } catch (error) {
    console.error('Failed to check auth, returning null:', error)
    return null
  }
}
