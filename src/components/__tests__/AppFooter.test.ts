import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'

describe('AppFooter', () => {
  it('renders footer with version', () => {
    const wrapper = mount(AppFooter)
    expect(wrapper.text()).toContain('IdleMMO Profit Calculator')
    expect(wrapper.text()).toContain('v1.0.0')
  })

  it('renders all external links', () => {
    const wrapper = mount(AppFooter)
    const links = wrapper.findAll('a')

    expect(links.length).toBeGreaterThanOrEqual(3)

    // Check for IdleMMO official link
    const officialLink = links.find(link => link.text() === 'IdleMMO Official')
    expect(officialLink?.attributes('href')).toBe('https://www.idle-mmo.com/')
    expect(officialLink?.attributes('target')).toBe('_blank')
    expect(officialLink?.attributes('rel')).toBe('noopener noreferrer')

    // Check for GitHub link
    const githubLink = links.find(link => link.text() === 'GitHub')
    expect(githubLink?.attributes('href')).toBe('https://github.com/felixlaguna/idle-mmo-profiter')
    expect(githubLink?.attributes('target')).toBe('_blank')

    // Check for Report Issue link
    const issueLink = links.find(link => link.text() === 'Report Issue')
    expect(issueLink?.attributes('href')).toBe('https://github.com/felixlaguna/idle-mmo-profiter/issues')
    expect(issueLink?.attributes('target')).toBe('_blank')
  })

  it('displays current year', () => {
    const wrapper = mount(AppFooter)
    const currentYear = new Date().getFullYear()
    expect(wrapper.text()).toContain(`© ${currentYear}`)
  })

  it('displays disclaimer text', () => {
    const wrapper = mount(AppFooter)
    expect(wrapper.text()).toContain('Not affiliated with IdleMMO')
  })

  it('has proper footer structure', () => {
    const wrapper = mount(AppFooter)
    const footer = wrapper.find('footer')
    expect(footer.exists()).toBe(true)
    expect(footer.classes()).toContain('app-footer')
  })

  it('has accessible link labels', () => {
    const wrapper = mount(AppFooter)
    const links = wrapper.findAll('a')

    links.forEach(link => {
      expect(link.attributes('aria-label')).toBeTruthy()
    })
  })
})
