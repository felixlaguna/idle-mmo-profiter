import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with default size', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    expect(wrapper.find('.spinner-medium').exists()).toBe(true)
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('renders with small size', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'small',
      },
    })

    expect(wrapper.find('.spinner-small').exists()).toBe(true)
  })

  it('renders with large size', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'large',
      },
    })

    expect(wrapper.find('.spinner-large').exists()).toBe(true)
  })

  it('displays message when provided', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        message: 'Loading data...',
      },
    })

    expect(wrapper.find('.loading-message').exists()).toBe(true)
    expect(wrapper.find('.loading-message').text()).toBe('Loading data...')
  })

  it('does not display message when not provided', () => {
    const wrapper = mount(LoadingSpinner)

    expect(wrapper.find('.loading-message').exists()).toBe(false)
  })

  it('has proper ARIA attributes', () => {
    const wrapper = mount(LoadingSpinner)

    const spinner = wrapper.find('.loading-spinner')
    expect(spinner.attributes('role')).toBe('status')
    expect(spinner.attributes('aria-live')).toBe('polite')
  })

  it('includes screen reader text', () => {
    const wrapper = mount(LoadingSpinner)

    const srText = wrapper.find('.sr-only')
    expect(srText.exists()).toBe(true)
    expect(srText.text()).toBe('Loading...')
  })

  it('does not timeout when timeout prop is not provided', () => {
    const wrapper = mount(LoadingSpinner)

    vi.advanceTimersByTime(30000) // Advance time by 30 seconds

    expect(wrapper.find('.timeout-icon').exists()).toBe(false)
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('times out after specified duration', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 5000,
      },
    })

    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.find('.timeout-icon').exists()).toBe(false)

    // Advance time past timeout
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.spinner').exists()).toBe(false)
    expect(wrapper.find('.timeout-icon').exists()).toBe(true)
    expect(wrapper.find('.timeout-message').exists()).toBe(true)
  })

  it('emits timeout event when timeout occurs', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 3000,
      },
    })

    expect(wrapper.emitted('timeout')).toBeFalsy()

    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('timeout')).toBeTruthy()
    expect(wrapper.emitted('timeout')?.length).toBe(1)
  })

  it('displays timeout message after timeout', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 5000,
        message: 'Loading...',
      },
    })

    expect(wrapper.find('.loading-message').exists()).toBe(true)
    expect(wrapper.find('.timeout-message').exists()).toBe(false)

    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loading-message').exists()).toBe(false)
    expect(wrapper.find('.timeout-message').exists()).toBe(true)
    expect(wrapper.find('.timeout-message').text()).toContain('taking longer than expected')
  })

  it('updates screen reader text after timeout', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 5000,
      },
    })

    expect(wrapper.find('.sr-only').text()).toBe('Loading...')

    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.sr-only').text()).toBe('Loading timed out')
  })

  it('adds timed-out class when timeout occurs', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 5000,
      },
    })

    expect(wrapper.find('.has-timed-out').exists()).toBe(false)

    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.has-timed-out').exists()).toBe(true)
  })

  it('clears timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 5000,
      },
    })

    wrapper.unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('does not clear timeout on unmount when no timeout is set', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const wrapper = mount(LoadingSpinner)

    wrapper.unmount()

    // clearTimeout should not be called when there's no timeout
    expect(clearTimeoutSpy).not.toHaveBeenCalled()
  })

  it('handles zero timeout gracefully', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: 0,
      },
    })

    // Zero timeout should not trigger timeout
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.find('.timeout-icon').exists()).toBe(false)
  })

  it('handles negative timeout gracefully', async () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        timeout: -1000,
      },
    })

    // Negative timeout should not trigger timeout
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.spinner').exists()).toBe(true)
    expect(wrapper.find('.timeout-icon').exists()).toBe(false)
  })
})
