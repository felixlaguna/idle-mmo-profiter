/**
 * Rate-limited API client for IdleMMO API
 *
 * CRITICAL: IdleMMO API has a 20 requests/minute rate limit.
 * This client implements:
 * - Request queue with sliding window rate limiter
 * - Automatic retry on 429 (Too Many Requests) with exponential backoff
 * - Respect for X-RateLimit-Remaining and X-RateLimit-Reset headers
 * - Request deduplication (same URL returns same promise)
 * - No requests made if API key is not set
 */

import { storageManager } from '../storage/persistence'

// Use proxy in development, configurable in production
// In dev: Vite proxy at /api forwards to https://api.idle-mmo.com
// In prod: Can be configured via VITE_API_BASE_URL env var
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const MAX_REQUESTS_PER_MINUTE = 20
const WINDOW_SIZE_MS = 60000 // 1 minute in milliseconds
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 5000 // 5 seconds
const MAX_BACKOFF_MS = 120000 // 120 seconds (2 minutes)
const RATE_LIMIT_THRESHOLD = 3 // Pause queue if remaining < this

// Custom Error Types
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

interface QueuedRequest {
  url: string
  options: RequestInit
  resolve: (value: Response) => void
  reject: (error: Error) => void
  retryCount: number
}

interface RateLimitInfo {
  remaining: number | null
  reset: number | null // Unix timestamp
  limit: number | null
}

class RateLimitedApiClient {
  private requestQueue: QueuedRequest[] = []
  private requestTimestamps: number[] = []
  private processing = false
  private rateLimitInfo: RateLimitInfo = {
    remaining: null,
    reset: null,
    limit: null,
  }
  // Request deduplication: track in-flight requests by URL
  // Maps URL to Promise of parsed JSON data
  private inFlightRequests = new Map<string, Promise<unknown>>()

  /**
   * Get API key from localStorage
   */
  private getApiKey(): string | null {
    const settings = storageManager.getSettings()
    return settings.apiKey
  }

  /**
   * Check if API client is configured with a valid API key
   */
  public isConfigured(): boolean {
    const apiKey = this.getApiKey()
    return apiKey !== null && apiKey.length > 0
  }

  /**
   * Get current rate limit status
   */
  public getRateLimitStatus(): RateLimitInfo {
    return { ...this.rateLimitInfo }
  }

  /**
   * Check if we can make a request based on sliding window rate limit
   */
  private canMakeRequest(): boolean {
    const now = Date.now()

    // Remove timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < WINDOW_SIZE_MS
    )

    // If we have rate limit info from headers, check threshold
    if (
      this.rateLimitInfo.remaining !== null &&
      this.rateLimitInfo.remaining < RATE_LIMIT_THRESHOLD
    ) {
      return false
    }

    // Check if we're under the rate limit
    return this.requestTimestamps.length < MAX_REQUESTS_PER_MINUTE
  }

  /**
   * Get time to wait before next request is allowed (in ms)
   */
  private getWaitTime(): number {
    // If we have rate limit reset info from headers and we're at/near limit, use it
    if (
      this.rateLimitInfo.reset &&
      this.rateLimitInfo.remaining !== null &&
      this.rateLimitInfo.remaining < RATE_LIMIT_THRESHOLD
    ) {
      const resetTime = this.rateLimitInfo.reset * 1000 // Convert to ms
      const now = Date.now()
      if (resetTime > now) {
        return resetTime - now
      }
    }

    // Otherwise, calculate based on sliding window
    if (this.requestTimestamps.length === 0) {
      return 0
    }

    const now = Date.now()
    const oldestTimestamp = this.requestTimestamps[0]
    const timeSinceOldest = now - oldestTimestamp

    if (timeSinceOldest < WINDOW_SIZE_MS) {
      return WINDOW_SIZE_MS - timeSinceOldest + 100 // Add 100ms buffer
    }

    return 0
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimitInfo(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const reset = response.headers.get('X-RateLimit-Reset')
    const limit = response.headers.get('X-RateLimit-Limit')

    if (remaining !== null) {
      this.rateLimitInfo.remaining = parseInt(remaining, 10)
    }

    if (reset !== null) {
      this.rateLimitInfo.reset = parseInt(reset, 10)
    }

    if (limit !== null) {
      this.rateLimitInfo.limit = parseInt(limit, 10)
    }
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(
    url: string,
    options: RequestInit,
    retryCount: number
  ): Promise<Response> {
    const apiKey = this.getApiKey()

    if (!apiKey) {
      throw new AuthError('API key not configured')
    }

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

    // Add required headers
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${apiKey}`)
    headers.set('Accept', 'application/json')
    headers.set('User-Agent', 'IdleMMO-ProfitCalc/1.0')

    const requestOptions: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(fullUrl, requestOptions)

      // Update rate limit info from headers
      this.updateRateLimitInfo(response)

      // Handle 401/403 (Authentication/Authorization errors)
      if (response.status === 401 || response.status === 403) {
        throw new AuthError(`Authentication failed: ${response.statusText}`)
      }

      // Handle 404 (Not Found)
      if (response.status === 404) {
        throw new NotFoundError(`Resource not found: ${url}`)
      }

      // Handle 429 (Too Many Requests) with exponential backoff
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          // Exponential backoff: 5s, 10s, 20s (capped at 120s)
          const backoffTime = Math.min(
            INITIAL_BACKOFF_MS * Math.pow(2, retryCount),
            MAX_BACKOFF_MS
          )

          // Also check if we have reset time from headers
          const waitTime = Math.max(backoffTime, this.getWaitTime())

          console.warn(
            `Rate limit exceeded, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
          )

          await new Promise((resolve) => setTimeout(resolve, waitTime))

          // Retry the request
          return this.makeRequest(url, options, retryCount + 1)
        } else {
          throw new RateLimitError('Rate limit exceeded, max retries reached')
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new NetworkError(`HTTP error ${response.status}: ${response.statusText}`)
      }

      // Record successful request timestamp
      this.requestTimestamps.push(Date.now())

      return response
    } catch (error) {
      // Re-throw our custom errors
      if (
        error instanceof RateLimitError ||
        error instanceof AuthError ||
        error instanceof NotFoundError ||
        error instanceof NetworkError
      ) {
        throw error
      }

      // Wrap other errors as NetworkError
      if (error instanceof Error) {
        throw new NetworkError(`Network request failed: ${error.message}`)
      }

      throw new NetworkError('Network request failed: Unknown error')
    }
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return
    }

    this.processing = true

    while (this.requestQueue.length > 0) {
      // Check if we can make a request
      if (!this.canMakeRequest()) {
        const waitTime = this.getWaitTime()
        console.log(`Rate limit reached, waiting ${waitTime}ms before next request`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      }

      const request = this.requestQueue.shift()
      if (!request) break

      try {
        const response = await this.makeRequest(
          request.url,
          request.options,
          request.retryCount
        )
        request.resolve(response)
      } catch (error) {
        request.reject(error as Error)
      }
    }

    this.processing = false
  }

  /**
   * Queue a request and return a promise that resolves when the request completes
   */
  private request(url: string, options: RequestInit = {}): Promise<Response> {
    // Check if API key is set
    const apiKey = this.getApiKey()
    if (!apiKey) {
      return Promise.reject(new AuthError('API key not configured'))
    }

    // Create new promise for this request
    const requestPromise = new Promise<Response>((resolve, reject) => {
      // Add request to queue
      this.requestQueue.push({
        url,
        options,
        resolve,
        reject,
        retryCount: 0,
      })

      // Start processing queue
      this.processQueue()
    })

    return requestPromise
  }

  /**
   * Helper method for GET requests with query parameters
   */
  public async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    // Build URL with query parameters
    let url = path
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value))
      })
      url = `${path}?${searchParams.toString()}`
    }

    // Request deduplication: if same URL is already in-flight, return existing promise
    const existingRequest = this.inFlightRequests.get(url)
    if (existingRequest) {
      console.log(`Deduplicating request for ${url}`)
      return existingRequest as Promise<T>
    }

    // Create promise that fetches and parses JSON
    const dataPromise = this.request(url, { method: 'GET' }).then(response => response.json() as Promise<T>)

    // Track in-flight request
    this.inFlightRequests.set(url, dataPromise)

    // Clean up after request completes (success or failure)
    dataPromise.finally(() => {
      this.inFlightRequests.delete(url)
    })

    return dataPromise
  }

  /**
   * Helper method for POST requests
   */
  public async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json() as Promise<T>
  }

  /**
   * Get current queue length (useful for debugging/monitoring)
   */
  public getQueueLength(): number {
    return this.requestQueue.length
  }

  /**
   * Get number of in-flight requests
   */
  public getInFlightCount(): number {
    return this.inFlightRequests.size
  }

  /**
   * Clear the request queue (useful for testing or emergency stop)
   */
  public clearQueue(): void {
    this.requestQueue.forEach((req) => req.reject(new NetworkError('Request queue cleared')))
    this.requestQueue = []
    this.inFlightRequests.clear()
  }
}

// Export singleton instance
export const apiClient = new RateLimitedApiClient()

// Also export the class for testing
export { RateLimitedApiClient as ApiClient }
