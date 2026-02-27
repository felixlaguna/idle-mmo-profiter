/**
 * API Module Index
 *
 * Re-exports all API-related functionality for easy importing
 */

// Client
export { apiClient, ApiClient } from './client'

// Error types
export { RateLimitError, AuthError, NotFoundError, NetworkError } from './client'

// Cache
export {
  get,
  set,
  invalidate,
  invalidateAll,
  getAge,
  clearExpiredCache,
  getCacheStats,
  generateCacheKey,
} from './cache'

// Services
export {
  searchItems,
  inspectItem,
  getItemDetails,
  getMarketHistory,
  getMarketPrices,
  getAverageMarketPrice,
  batchSearchItems,
  batchGetItemDetails,
  checkAuth,
} from './services'

// Types
export type {
  ItemSearchResult,
  ItemSearchResponse,
  ItemRecipe,
  ItemRecipeMaterial,
  ItemRecipeResult,
  ItemDetails,
  MarketHistoryEntry,
  LatestSoldEntry,
  MarketHistoryResponse,
} from './services'

// Mock data provider
export {
  MockProvider,
  ApiProvider,
  createDataProvider,
  getDataProvider,
  resetDataProvider,
  getDataProviderStatus,
  type DataProvider,
  type DataProviderStatus,
} from './mock'
