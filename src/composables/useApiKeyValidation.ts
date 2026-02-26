import { ref } from 'vue'
import type { AuthCheckResponse, ApiKeyInfo } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface ValidationResult {
  isValid: boolean
  error: string | null
  keyInfo: ApiKeyInfo | null
  rateLimitRemaining: number | null
  rateLimitReset: number | null
}

/**
 * Composable for validating API keys with the IdleMMO API
 */
export function useApiKeyValidation() {
  const isValidating = ref(false)
  const lastValidation = ref<ValidationResult | null>(null)

  /**
   * Validate an API key by calling /v1/auth/check
   * Returns validation result with key info and rate limit data
   */
  async function validateApiKey(apiKey: string): Promise<ValidationResult> {
    isValidating.value = true

    try {
      const response = await fetch(`${BASE_URL}/auth/check`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          'User-Agent': 'IdleMMO-ProfitCalc/1.0',
        },
      })

      // Extract rate limit info from headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
      const rateLimitReset = response.headers.get('X-RateLimit-Reset')

      if (!response.ok) {
        let errorMessage = 'Invalid API key'

        if (response.status === 401) {
          errorMessage = 'Authentication failed - Invalid API key'
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden - Check API key permissions'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded - Please try again later'
        } else {
          errorMessage = `API error: ${response.status} ${response.statusText}`
        }

        const result: ValidationResult = {
          isValid: false,
          error: errorMessage,
          keyInfo: null,
          rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null,
          rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) : null,
        }

        lastValidation.value = result
        return result
      }

      const data = (await response.json()) as AuthCheckResponse

      if (!data.authenticated) {
        const result: ValidationResult = {
          isValid: false,
          error: 'API key not authenticated',
          keyInfo: null,
          rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null,
          rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) : null,
        }

        lastValidation.value = result
        return result
      }

      const result: ValidationResult = {
        isValid: true,
        error: null,
        keyInfo: data.api_key,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null,
        rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) : null,
      }

      lastValidation.value = result
      return result
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `Network error: ${error.message}` : 'Failed to validate API key'

      const result: ValidationResult = {
        isValid: false,
        error: errorMessage,
        keyInfo: null,
        rateLimitRemaining: null,
        rateLimitReset: null,
      }

      lastValidation.value = result
      return result
    } finally {
      isValidating.value = false
    }
  }

  /**
   * Format Unix timestamp to human-readable time
   */
  function formatResetTime(resetTimestamp: number): string {
    const resetDate = new Date(resetTimestamp * 1000)
    const now = new Date()
    const diffMs = resetDate.getTime() - now.getTime()

    if (diffMs <= 0) {
      return 'now'
    }

    const diffMinutes = Math.floor(diffMs / 60000)
    const diffSeconds = Math.floor((diffMs % 60000) / 1000)

    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`
    }

    return `${diffSeconds}s`
  }

  return {
    isValidating,
    lastValidation,
    validateApiKey,
    formatResetTime,
  }
}
