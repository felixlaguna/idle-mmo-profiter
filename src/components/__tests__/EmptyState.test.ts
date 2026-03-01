import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('renders with required props', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data available',
      },
    })

    expect(wrapper.find('.empty-title').text()).toBe('No data available')
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('renders icon when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        icon: '📭',
      },
    })

    expect(wrapper.find('.empty-icon').exists()).toBe(true)
    expect(wrapper.find('.empty-icon').text()).toBe('📭')
  })

  it('renders description when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        description: 'Try adding some data to get started',
      },
    })

    expect(wrapper.find('.empty-description').exists()).toBe(true)
    expect(wrapper.find('.empty-description').text()).toBe('Try adding some data to get started')
  })

  it('renders button action when actionText is provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        actionText: 'Add Data',
      },
    })

    const button = wrapper.find('.empty-action-primary')
    expect(button.exists()).toBe(true)
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.text()).toBe('Add Data')
  })

  it('renders link action when actionText and actionHref are provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        actionText: 'Learn More',
        actionHref: 'https://example.com',
      },
    })

    const link = wrapper.find('.empty-action-primary')
    expect(link.exists()).toBe(true)
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('https://example.com')
    expect(link.text()).toBe('Learn More')
  })

  it('emits action event when button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        actionText: 'Click Me',
      },
    })

    await wrapper.find('.empty-action-primary').trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')?.length).toBe(1)
  })

  it('renders secondary action button when provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        actionText: 'Primary Action',
        secondaryActionText: 'Secondary Action',
      },
    })

    expect(wrapper.find('.empty-action-primary').exists()).toBe(true)
    expect(wrapper.find('.empty-action-secondary').exists()).toBe(true)
    expect(wrapper.find('.empty-action-secondary').text()).toBe('Secondary Action')
  })

  it('emits secondary-action event when secondary button is clicked', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
        actionText: 'Primary',
        secondaryActionText: 'Secondary',
      },
    })

    await wrapper.find('.empty-action-secondary').trigger('click')

    expect(wrapper.emitted('secondary-action')).toBeTruthy()
    expect(wrapper.emitted('secondary-action')?.length).toBe(1)
  })

  it('applies default variant class by default', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
      },
    })

    expect(wrapper.find('.empty-state-default').exists()).toBe(true)
  })

  it('applies error variant class when specified', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Error occurred',
        variant: 'error',
      },
    })

    expect(wrapper.find('.empty-state-error').exists()).toBe(true)
  })

  it('applies info variant class when specified', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Information',
        variant: 'info',
      },
    })

    expect(wrapper.find('.empty-state-info').exists()).toBe(true)
  })

  it('has proper ARIA attributes', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No data',
      },
    })

    const emptyState = wrapper.find('.empty-state')
    expect(emptyState.attributes('role')).toBe('status')
    expect(emptyState.attributes('aria-live')).toBe('polite')
  })

  it('renders actions wrapper only when actions are present', () => {
    const wrapperWithoutActions = mount(EmptyState, {
      props: {
        title: 'No data',
      },
    })

    expect(wrapperWithoutActions.find('.empty-actions').exists()).toBe(false)

    const wrapperWithActions = mount(EmptyState, {
      props: {
        title: 'No data',
        actionText: 'Action',
      },
    })

    expect(wrapperWithActions.find('.empty-actions').exists()).toBe(true)
  })

  it('handles all props together', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: '🔍',
        title: 'No results found',
        description: 'Try adjusting your search filters',
        actionText: 'Clear Filters',
        secondaryActionText: 'Reset All',
        variant: 'info',
      },
    })

    expect(wrapper.find('.empty-icon').text()).toBe('🔍')
    expect(wrapper.find('.empty-title').text()).toBe('No results found')
    expect(wrapper.find('.empty-description').text()).toBe('Try adjusting your search filters')
    expect(wrapper.find('.empty-action-primary').text()).toBe('Clear Filters')
    expect(wrapper.find('.empty-action-secondary').text()).toBe('Reset All')
    expect(wrapper.find('.empty-state-info').exists()).toBe(true)
  })
})
