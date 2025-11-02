import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('applies correct variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary',
      },
    })
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('applies correct size classes', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'lg',
      },
    })
    expect(wrapper.classes()).toContain('btn-lg')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true,
      },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted()).not.toHaveProperty('click')
  })

  it('shows loading spinner when loading', () => {
    const wrapper = mount(Button, {
      props: {
        loading: true,
      },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('does not emit click when loading', async () => {
    const wrapper = mount(Button, {
      props: {
        loading: true,
      },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted()).not.toHaveProperty('click')
  })

  it('applies all default props correctly', () => {
    const wrapper = mount(Button)
    expect(wrapper.classes()).toContain('btn')
    expect(wrapper.classes()).toContain('btn-primary')
    expect(wrapper.classes()).toContain('btn-md')
    expect(wrapper.attributes('type')).toBe('button')
  })
})
