/**
 * API Module Index
 *
 * Re-exports all API-related functionality for easy importing
 */

// Client
export { apiClient } from './client'

// Cache
export {
  getCached,
  setCache,
  isCacheValid,
  clearCache,
  clearExpiredCache,
  getCacheStats,
  buildCacheKey,
  CacheKeyType,
} from './cache'

// Services
export {
  searchItems,
  getItemDetails,
  getMarketHistory,
  getMarketPrices,
  getAverageMarketPrice,
  batchSearchItems,
  batchGetItemDetails,
} from './services'

// Types
export type {
  ItemSearchResult,
  ItemSearchResponse,
  ItemRecipe,
  ItemDetails,
  MarketHistoryEntry,
  MarketListing,
  MarketHistoryResponse,
} from './services'
