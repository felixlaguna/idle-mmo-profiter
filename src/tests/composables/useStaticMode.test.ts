import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStaticMode } from '../../composables/useStaticMode'

describe('useStaticMode', () => {
  beforeEach(() => {
    // Reset import.meta.env before each test
    vi.unstubAllEnvs()
  })

  it('should return isStaticMode as false when VITE_STATIC_MODE is not set', () => {
    const { isStaticMode } = useStaticMode()
    expect(isStaticMode).toBe(false)
  })

  it('should return isStaticMode as false when VITE_STATIC_MODE is set to "false"', () => {
    vi.stubEnv('VITE_STATIC_MODE', 'false')
    const { isStaticMode } = useStaticMode()
    expect(isStaticMode).toBe(false)
  })

  it('should return isStaticMode as true when VITE_STATIC_MODE is set to "true"', () => {
    vi.stubEnv('VITE_STATIC_MODE', 'true')
    const { isStaticMode } = useStaticMode()
    expect(isStaticMode).toBe(true)
  })

  it('should return isStaticMode as false when VITE_STATIC_MODE is set to any other value', () => {
    vi.stubEnv('VITE_STATIC_MODE', 'yes')
    const { isStaticMode } = useStaticMode()
    expect(isStaticMode).toBe(false)
  })
})
