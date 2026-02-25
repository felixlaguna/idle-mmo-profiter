/**
 * Rate-limited API client for IdleMMO API
 *
 * CRITICAL: IdleMMO API has a 20 requests/minute rate limit.
 * This client implements:
 * - Request queue with sliding window rate limiter
 * - Automatic retry on 429 (Too Many Requests) with exponential backoff
 * - Respect for X-RateLimit-Remaining and X-RateLimit-Reset headers
 * - No requests made if API key is not set
 */

const BASE_URL = 'https://api.idle-mmo.com/v1'
const MAX_REQUESTS_PER_MINUTE = 20
const WINDOW_SIZE_MS = 60000 // 1 minute in milliseconds
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

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
}

class RateLimitedApiClient {
  private requestQueue: QueuedRequest[] = []
  private requestTimestamps: number[] = []
  private processing = false
  private rateLimitInfo: RateLimitInfo = {
    remaining: null,
    reset: null,
  }

  /**
   * Get API key from localStorage
   */
  private getApiKey(): string | null {
    try {
      const settings = localStorage.getItem('idlemmo-settings')
      if (!settings) return null
      const parsed = JSON.parse(settings)
      return parsed.apiKey || null
    } catch {
      return null
    }
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

    // Check if we're under the rate limit
    return this.requestTimestamps.length < MAX_REQUESTS_PER_MINUTE
  }

  /**
   * Get time to wait before next request is allowed (in ms)
   */
  private getWaitTime(): number {
    if (this.requestTimestamps.length === 0) {
      return 0
    }

    // If we have rate limit reset info from headers, use it
    if (this.rateLimitInfo.reset && this.rateLimitInfo.remaining === 0) {
      const resetTime = this.rateLimitInfo.reset * 1000 // Convert to ms
      const now = Date.now()
      if (resetTime > now) {
        return resetTime - now
      }
    }

    // Otherwise, calculate based on sliding window
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

    if (remaining !== null) {
      this.rateLimitInfo.remaining = parseInt(remaining, 10)
    }

    if (reset !== null) {
      this.rateLimitInfo.reset = parseInt(reset, 10)
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
      throw new Error('API key not configured')
    }

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

    // Add required headers
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${apiKey}`)
    headers.set('Accept', 'application/json')
    headers.set('User-Agent', 'idle-mmo-profiter/1.0')

    const requestOptions: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(fullUrl, requestOptions)

      // Update rate limit info from headers
      this.updateRateLimitInfo(response)

      // Handle 429 (Too Many Requests) with exponential backoff
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retryCount)

          // Also check if we have reset time from headers
          const waitTime = Math.max(backoffTime, this.getWaitTime())

          console.warn(
            `Rate limit exceeded, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
          )

          await new Promise((resolve) => setTimeout(resolve, waitTime))

          // Retry the request
          return this.makeRequest(url, options, retryCount + 1)
        } else {
          throw new Error('Rate limit exceeded, max retries reached')
        }
      }

      // Record successful request timestamp
      this.requestTimestamps.push(Date.now())

      return response
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network request failed')
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
  public request(url: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Check if API key is set
      const apiKey = this.getApiKey()
      if (!apiKey) {
        reject(new Error('API key not configured'))
        return
      }

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
  }

  /**
   * Helper method for GET requests
   */
  public async get(url: string): Promise<Response> {
    return this.request(url, { method: 'GET' })
  }

  /**
   * Helper method for POST requests
   */
  public async post(url: string, body?: unknown): Promise<Response> {
    return this.request(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Get current queue length (useful for debugging/monitoring)
   */
  public getQueueLength(): number {
    return this.requestQueue.length
  }

  /**
   * Get current rate limit info
   */
  public getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo }
  }

  /**
   * Clear the request queue (useful for testing or emergency stop)
   */
  public clearQueue(): void {
    this.requestQueue.forEach((req) =>
      req.reject(new Error('Request queue cleared'))
    )
    this.requestQueue = []
  }
}

// Export singleton instance
export const apiClient = new RateLimitedApiClient()
