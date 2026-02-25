/**
 * API service methods for IdleMMO items and market data
 *
 * All methods:
 * 1. Check cache first
 * 2. If cache miss, make API request through rate-limited client
 * 3. Cache the response before returning
 */

import { apiClient } from './client'
import {
  getCached,
  setCache,
  buildCacheKey,
  CacheKeyType,
} from './cache'

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
 * Search for items by name or type
 *
 * @param query - Search query (item name or type)
 * @param page - Page number (default: 1)
 * @returns Item search results with pagination
 */
export async function searchItems(
  query: string,
  page = 1
): Promise<ItemSearchResponse> {
  // Build cache key
  const cacheKey = buildCacheKey(
    CacheKeyType.ITEM_SEARCH,
    `${query}-page${page}`
  )

  // Check cache first
  const cached = getCached<ItemSearchResponse>(cacheKey)
  if (cached) {
    console.log(`Cache hit for item search: ${query} (page ${page})`)
    return cached
  }

  // Cache miss - make API request
  console.log(`Cache miss for item search: ${query} (page ${page}), fetching from API`)

  try {
    const url = `/item/search?query=${encodeURIComponent(query)}&page=${page}`
    const response = await apiClient.get(url)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data: ItemSearchResponse = await response.json()

    // Cache the result
    setCache(cacheKey, data)

    return data
  } catch (error) {
    console.error('Failed to search items:', error)
    throw error
  }
}

/**
 * Get detailed information about a specific item
 *
 * @param hashedItemId - The hashed item ID
 * @returns Detailed item information including recipes
 */
export async function getItemDetails(
  hashedItemId: string
): Promise<ItemDetails> {
  // Build cache key
  const cacheKey = buildCacheKey(CacheKeyType.ITEM_DETAILS, hashedItemId)

  // Check cache first
  const cached = getCached<ItemDetails>(cacheKey)
  if (cached) {
    console.log(`Cache hit for item details: ${hashedItemId}`)
    return cached
  }

  // Cache miss - make API request
  console.log(`Cache miss for item details: ${hashedItemId}, fetching from API`)

  try {
    const url = `/item/${hashedItemId}/inspect`
    const response = await apiClient.get(url)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data: ItemDetails = await response.json()

    // Cache the result
    setCache(cacheKey, data)

    return data
  } catch (error) {
    console.error('Failed to get item details:', error)
    throw error
  }
}

/**
 * Get market history and current listings for an item
 *
 * @param hashedItemId - The hashed item ID
 * @returns Market history, buy orders, and sell orders
 */
export async function getMarketHistory(
  hashedItemId: string
): Promise<MarketHistoryResponse> {
  // Build cache key
  const cacheKey = buildCacheKey(CacheKeyType.MARKET_HISTORY, hashedItemId)

  // Check cache first
  const cached = getCached<MarketHistoryResponse>(cacheKey)
  if (cached) {
    console.log(`Cache hit for market history: ${hashedItemId}`)
    return cached
  }

  // Cache miss - make API request
  console.log(`Cache miss for market history: ${hashedItemId}, fetching from API`)

  try {
    const url = `/item/${hashedItemId}/market-history`
    const response = await apiClient.get(url)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data: MarketHistoryResponse = await response.json()

    // Cache the result (with shorter TTL for market data)
    setCache(cacheKey, data)

    return data
  } catch (error) {
    console.error('Failed to get market history:', error)
    throw error
  }
}

/**
 * Get the current best buy and sell prices from market data
 *
 * @param hashedItemId - The hashed item ID
 * @returns Object with best buy and sell prices, or null if no data
 */
export async function getMarketPrices(
  hashedItemId: string
): Promise<{ buyPrice: number | null; sellPrice: number | null }> {
  try {
    const marketData = await getMarketHistory(hashedItemId)

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
  } catch (error) {
    console.error('Failed to get market prices:', error)
    return { buyPrice: null, sellPrice: null }
  }
}

/**
 * Get average market price from recent history
 *
 * @param hashedItemId - The hashed item ID
 * @param limit - Number of recent transactions to average (default: 10)
 * @returns Average price or null if no data
 */
export async function getAverageMarketPrice(
  hashedItemId: string,
  limit = 10
): Promise<number | null> {
  try {
    const marketData = await getMarketHistory(hashedItemId)

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
  } catch (error) {
    console.error('Failed to get average market price:', error)
    return null
  }
}

/**
 * Batch search for multiple items
 * Uses the client's queue to automatically rate-limit requests
 *
 * @param queries - Array of search queries
 * @returns Array of search results
 */
export async function batchSearchItems(
  queries: string[]
): Promise<ItemSearchResponse[]> {
  console.log(`Batch searching ${queries.length} items`)

  const promises = queries.map((query) => searchItems(query, 1))

  try {
    return await Promise.all(promises)
  } catch (error) {
    console.error('Batch search failed:', error)
    throw error
  }
}

/**
 * Batch get item details for multiple items
 * Uses the client's queue to automatically rate-limit requests
 *
 * @param hashedItemIds - Array of hashed item IDs
 * @returns Array of item details
 */
export async function batchGetItemDetails(
  hashedItemIds: string[]
): Promise<ItemDetails[]> {
  console.log(`Batch fetching details for ${hashedItemIds.length} items`)

  const promises = hashedItemIds.map((id) => getItemDetails(id))

  try {
    return await Promise.all(promises)
  } catch (error) {
    console.error('Batch get item details failed:', error)
    throw error
  }
}
