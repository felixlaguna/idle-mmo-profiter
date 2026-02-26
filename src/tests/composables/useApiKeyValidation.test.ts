import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApiKeyValidation } from '../../composables/useApiKeyValidation'

// Mock fetch globally
global.fetch = vi.fn()

describe('useApiKeyValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateApiKey', () => {
    it('should return valid result for successful authentication', async () => {
      const mockResponse = {
        authenticated: true,
        user: { id: 12345 },
        character: { id: 67890, hashed_id: 'c1234567890', name: 'TestChar' },
        api_key: {
          name: 'Test API Key',
          rate_limit: 20,
          expires_at: '2025-12-31T23:59:59.000000Z',
          scopes: ['v1.auth.check', 'v1.market.items'],
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-RateLimit-Remaining', '19'],
          ['X-RateLimit-Reset', '1640000000'],
        ]),
        json: async () => mockResponse,
      })

      const { validateApiKey } = useApiKeyValidation()
      const result = await validateApiKey('test-api-key-123')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.keyInfo).toEqual(mockResponse.api_key)
      expect(result.rateLimitRemaining).toBe(19)
      expect(result.rateLimitReset).toBe(1640000000)
    })

    it('should return error for 401 unauthorized', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Map(),
      })

      const { validateApiKey } = useApiKeyValidation()
      const result = await validateApiKey('invalid-key')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Authentication failed - Invalid API key')
      expect(result.keyInfo).toBeNull()
    })

    it('should return error for 403 forbidden', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map(),
      })

      const { validateApiKey } = useApiKeyValidation()
      const result = await validateApiKey('forbidden-key')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Access forbidden - Check API key permissions')
      expect(result.keyInfo).toBeNull()
    })

    it('should return error for 429 rate limit exceeded', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([
          ['X-RateLimit-Remaining', '0'],
          ['X-RateLimit-Reset', '1640000060'],
        ]),
      })

      const { validateApiKey } = useApiKeyValidation()
      const result = await validateApiKey('rate-limited-key')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Rate limit exceeded - Please try again later')
      expect(result.rateLimitRemaining).toBe(0)
      expect(result.rateLimitReset).toBe(1640000060)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network failure'))

      const { validateApiKey } = useApiKeyValidation()
      const result = await validateApiKey('test-key')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Network error: Network failure')
      expect(result.keyInfo).toBeNull()
    })

    it('should handle authenticated=false in response', async () => {
      const mockResponse = {
        authenticated: false,
        user: null,
        character: null,
        api_key: null,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => mockResponse,
      })

      const { validateApiKey } = useApiKeyValidation()
      const result = await validateApiKey('unauthenticated-key')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('API key not authenticated')
      expect(result.keyInfo).toBeNull()
    })

    it('should set isValidating flag during validation', async () => {
      let resolvePromise: any
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValueOnce(delayedPromise)

      const { validateApiKey, isValidating } = useApiKeyValidation()

      expect(isValidating.value).toBe(false)

      const validationPromise = validateApiKey('test-key')

      // Should be validating now
      expect(isValidating.value).toBe(true)

      // Resolve the fetch
      resolvePromise({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => ({
          authenticated: true,
          api_key: {
            name: 'Test',
            rate_limit: 20,
            expires_at: '2025-12-31T23:59:59.000000Z',
            scopes: ['v1.auth.check'],
          },
        }),
      })

      await validationPromise

      // Should no longer be validating
      expect(isValidating.value).toBe(false)
    })

    it('should store last validation result', async () => {
      const mockResponse = {
        authenticated: true,
        user: { id: 12345 },
        character: { id: 67890, hashed_id: 'c123', name: 'Test' },
        api_key: {
          name: 'Test Key',
          rate_limit: 20,
          expires_at: '2025-12-31T23:59:59.000000Z',
          scopes: ['v1.auth.check'],
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => mockResponse,
      })

      const { validateApiKey, lastValidation } = useApiKeyValidation()

      expect(lastValidation.value).toBeNull()

      await validateApiKey('test-key')

      expect(lastValidation.value).not.toBeNull()
      expect(lastValidation.value?.isValid).toBe(true)
      expect(lastValidation.value?.keyInfo?.name).toBe('Test Key')
    })
  })

  describe('formatResetTime', () => {
    it('should format time remaining correctly for minutes and seconds', () => {
      const { formatResetTime } = useApiKeyValidation()
      const now = Date.now()
      const futureTimestamp = Math.floor(now / 1000) + 125 // 2 minutes 5 seconds from now

      const formatted = formatResetTime(futureTimestamp)

      expect(formatted).toMatch(/2m \d+s/)
    })

    it('should format time remaining correctly for seconds only', () => {
      const { formatResetTime } = useApiKeyValidation()
      const now = Date.now()
      const futureTimestamp = Math.floor(now / 1000) + 45 // 45 seconds from now

      const formatted = formatResetTime(futureTimestamp)

      expect(formatted).toMatch(/\d+s/)
      expect(formatted).not.toMatch(/m/)
    })

    it('should return "now" for past timestamps', () => {
      const { formatResetTime } = useApiKeyValidation()
      const now = Date.now()
      const pastTimestamp = Math.floor(now / 1000) - 60 // 1 minute ago

      const formatted = formatResetTime(pastTimestamp)

      expect(formatted).toBe('now')
    })
  })
})
