/**
 * DataProviderStatus Component Tests
 *
 * Tests the status indicator component:
 * - Shows correct status when no API key configured
 * - Shows correct status when API key is configured
 * - Updates status periodically
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataProviderStatus from '../../components/DataProviderStatus.vue'
import { resetDataProvider } from '../../api/mock'

describe('DataProviderStatus', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDataProvider()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should display default data status when no API key configured', () => {
    const wrapper = mount(DataProviderStatus)

    expect(wrapper.find('.status-default').exists()).toBe(true)
    expect(wrapper.text()).toContain('Using default data')
  })

  it('should display API data status when API key is configured', () => {
    localStorage.setItem('immo-profit:settings', JSON.stringify({ apiKey: 'test-key', marketTaxRate: 0.12, magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 } }))
    resetDataProvider()

    const wrapper = mount(DataProviderStatus)

    expect(wrapper.find('.status-api').exists()).toBe(true)
  })

  it('should show correct icon for default data', () => {
    const wrapper = mount(DataProviderStatus)

    expect(wrapper.find('.status-icon').text()).toBe('📋')
  })

  it('should show correct icon for API data', () => {
    localStorage.setItem('immo-profit:settings', JSON.stringify({ apiKey: 'test-key', marketTaxRate: 0.12, magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 } }))
    resetDataProvider()

    const wrapper = mount(DataProviderStatus)

    expect(wrapper.find('.status-icon').text()).toBe('🔄')
  })

  it('should update status periodically', async () => {
    const wrapper = mount(DataProviderStatus)

    // Initially no API key
    expect(wrapper.find('.status-default').exists()).toBe(true)

    // Add API key
    localStorage.setItem('immo-profit:settings', JSON.stringify({ apiKey: 'test-key', marketTaxRate: 0.12, magicFind: { streak: 0, dungeon: 0, item: 0, bonus: 0 } }))
    resetDataProvider()

    // Fast-forward time by 30 seconds
    await vi.advanceTimersByTimeAsync(30000)
    await wrapper.vm.$nextTick()

    // Should now show API status
    expect(wrapper.find('.status-api').exists()).toBe(true)
  })

  it('should clean up interval on unmount', () => {
    const wrapper = mount(DataProviderStatus)
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

    wrapper.unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
