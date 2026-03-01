import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorBoundary from '../ErrorBoundary.vue'
import { defineComponent, h } from 'vue'

// Normal component that doesn't throw
const NormalComponent = defineComponent({
  render() {
    return h('div', { class: 'test-content' }, 'Normal content')
  },
})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console errors during tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error occurs', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    expect(wrapper.find('.test-content').exists()).toBe(true)
    expect(wrapper.find('.error-boundary').exists()).toBe(false)
  })

  it('provides friendly message generation for network errors', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    // Test the friendly message function by triggering an error manually
    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Network request failed'

    expect(component.friendlyMessage()).toContain('Unable to connect to the server')
  })

  it('provides friendly message generation for timeout errors', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Request timeout exceeded'

    expect(component.friendlyMessage()).toContain('took too long to complete')
  })

  it('provides friendly message generation for rate limit errors', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Rate limit exceeded'

    expect(component.friendlyMessage()).toContain('Too many requests')
  })

  it('provides friendly message generation for 404 errors', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Resource not found (404)'

    expect(component.friendlyMessage()).toContain('could not be found')
  })

  it('provides friendly message generation for auth errors', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Unauthorized (401)'

    expect(component.friendlyMessage()).toContain('Authentication failed')
  })

  it('provides generic friendly message for unknown errors', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Some random error'

    expect(component.friendlyMessage()).toContain('unexpected error occurred')
  })

  it('tracks retry count correctly', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any

    // Simulate error state
    component.hasError = true
    component.errorMessage = 'Test error'
    await wrapper.vm.$nextTick()

    expect(component.retryCount).toBe(0)

    // First reset
    component.reset()
    expect(component.retryCount).toBe(1)

    // Second reset
    component.hasError = true
    component.reset()
    expect(component.retryCount).toBe(2)

    // Third reset
    component.hasError = true
    component.reset()
    expect(component.retryCount).toBe(3)
  })

  it('prevents retry after max attempts', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error'
    component.retryCount = 3

    expect(component.canRetry()).toBe(false)

    // Reset should not clear error when max retries reached
    component.reset()
    expect(component.hasError).toBe(true)
  })

  it('allows hard reset to clear retry count', () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error'
    component.retryCount = 2

    component.hardReset()

    expect(component.retryCount).toBe(0)
    expect(component.hasError).toBe(false)
    expect(component.errorMessage).toBe('')
  })

  it('renders error UI structure when hasError is true', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error message'
    component.errorStack = 'Test stack trace'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-boundary').exists()).toBe(true)
    expect(wrapper.find('.error-icon').exists()).toBe(true)
    expect(wrapper.find('.error-title').exists()).toBe(true)
    expect(wrapper.find('.error-friendly').exists()).toBe(true)
    expect(wrapper.find('.error-details').exists()).toBe(true)
    expect(wrapper.find('.error-actions').exists()).toBe(true)
  })

  it('has proper ARIA attributes in error state', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error'
    await wrapper.vm.$nextTick()

    const errorBoundary = wrapper.find('.error-boundary')
    expect(errorBoundary.attributes('role')).toBe('alert')
    expect(errorBoundary.attributes('aria-live')).toBe('assertive')
  })

  it('renders retry button when retries are available', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error'
    component.retryCount = 1
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-action-primary').exists()).toBe(true)
    expect(wrapper.find('.retry-count').text()).toContain('(1/3)')
  })

  it('hides retry button when max retries reached', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error'
    component.retryCount = 3
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-action-primary').exists()).toBe(false)
    expect(wrapper.find('.error-hint').exists()).toBe(true)
  })

  it('always renders reset button', async () => {
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: h(NormalComponent),
      },
    })

    const component = wrapper.vm as any
    component.hasError = true
    component.errorMessage = 'Test error'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error-action-secondary').exists()).toBe(true)
  })
})
