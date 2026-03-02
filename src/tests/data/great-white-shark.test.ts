import { describe, it, expect } from 'vitest'
import defaults from '@/data/defaults.json'

describe('Great White Shark Data', () => {
  it('should have correct hashed ID', () => {
    const shark = defaults.resources.find((r) => r.name === 'Great White Shark')
    expect(shark).toBeDefined()
    expect(shark?.hashedId).toBe('3Zbym56qLxRNBRp7Eekd')
  })

  it('should have correct vendor value', () => {
    const shark = defaults.resources.find((r) => r.name === 'Great White Shark')
    expect(shark).toBeDefined()
    expect(shark?.vendorValue).toBe(41)
  })

  it('should be present in resources array', () => {
    const shark = defaults.resources.find((r) => r.name === 'Great White Shark')
    expect(shark).toBeDefined()
    expect(shark?.id).toBe('res-4')
    expect(shark?.name).toBe('Great White Shark')
  })
})
