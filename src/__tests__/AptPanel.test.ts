import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AptPanel, { type AptGroup } from '../components/AptPanel.vue'

// Mock Font Awesome icons
vi.mock('@fortawesome/fontawesome-free/css/all.css', () => ({}))

describe('AptPanel', () => {
  const mockAptGroups: AptGroup[] = [
    {
      id: 'apt-1',
      name: 'APT-29',
      description: 'Russian APT group',
      threatLevel: 'high',
      techniqueCount: 50,
      relevantTechniqueCount: 30,
      relevancyScore: 0.6,
      techniques: new Map([
        ['T1078', { score: 1, color: '#e60d0d', comment: 'Valid accounts' }]
      ]),
      layerColors: ['#e60d0d'],
      relevantTechniques: new Map([
        ['T1078', { score: 1, color: '#e60d0d', comment: 'Valid accounts' }]
      ])
    },
    {
      id: 'apt-2',
      name: 'Lazarus',
      description: 'North Korean APT group',
      threatLevel: 'high',
      techniqueCount: 40,
      relevantTechniqueCount: 20,
      relevancyScore: 0.5,
      techniques: new Map([
        ['T1055', { score: 1, color: '#e60d0d', comment: 'Process injection' }]
      ]),
      layerColors: ['#e60d0d', '#ff4444'],
      relevantTechniques: new Map([
        ['T1055', { score: 1, color: '#e60d0d', comment: 'Process injection' }]
      ])
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no APT groups', () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: [],
        activeIds: new Set(),
        totalGroups: 0
      }
    })

    expect(wrapper.text()).toContain('No relevant APT threats')
    expect(wrapper.text()).toContain('Configure your infrastructure to see applicable threats')
  })

  it('renders APT groups with correct information', () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(['apt-1']),
        totalGroups: 5
      }
    })

    expect(wrapper.text()).toContain('APT-29')
    expect(wrapper.text()).toContain('Russian APT group')
    expect(wrapper.text()).toContain('30/50') // relevant/total techniques
    expect(wrapper.text()).toContain('60%') // relevancy score
    expect(wrapper.text().toUpperCase()).toContain('HIGH') // threat level

    expect(wrapper.text()).toContain('Lazarus')
    expect(wrapper.text()).toContain('20/40')
    expect(wrapper.text()).toContain('50%')
  })

  it('shows correct stats', () => {
    const activeIds = new Set(['apt-1'])
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds,
        totalGroups: 5
      }
    })

    expect(wrapper.text()).toContain('Active APTs:1') // No space in actual output
    expect(wrapper.text()).toContain('Relevant:2/5') // No space in actual output
    expect(wrapper.text()).toContain('3 groups not relevant to your infrastructure')
  })

  it('emits toggle event when checkbox clicked', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.trigger('change')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')?.[0]).toEqual(['apt-1'])
  })

  it('emits enable-all event when All button clicked', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    const allButton = wrapper.findAll('button').find(btn =>
      btn.attributes('title') === 'Enable All'
    )
    expect(allButton).toBeTruthy()
    if (allButton) {
      await allButton.trigger('click')
    }

    expect(wrapper.emitted('enable-all')).toBeTruthy()
  })

  it('emits disable-all event when None button clicked', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(['apt-1', 'apt-2']),
        totalGroups: 2
      }
    })

    const noneButton = wrapper.findAll('button').find(btn =>
      btn.attributes('title') === 'Disable All'
    )
    expect(noneButton).toBeTruthy()
    if (noneButton) {
      await noneButton.trigger('click')
    }

    expect(wrapper.emitted('disable-all')).toBeTruthy()
  })

  it('shows edit functionality', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    // Initially shows name as text
    expect(wrapper.text()).toContain('APT-29')
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)

    // Find and click edit button
    const editButton = wrapper.findAll('button').find(btn =>
      btn.attributes('title') === 'Rename'
    )
    expect(editButton).toBeTruthy()
    if (editButton) {
      await editButton.trigger('click')
    }

    // Should now show input field
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('filters APT groups by search', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    const searchInput = wrapper.find('input[placeholder="Search APT groups..."]')
    await searchInput.setValue('Lazarus')

    // Should only show Lazarus group
    expect(wrapper.text()).toContain('Lazarus')
    expect(wrapper.text()).not.toContain('APT-29')
  })

  it('shows color indicators', () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    // Check for color indicators in the DOM
    const colorIndicators = wrapper.findAll('[style*="background-color"]')
    expect(colorIndicators.length).toBeGreaterThan(0)

    // First group has 1 color, second group has 2 colors
    const firstGroupColors = wrapper.findAll('[style*="#e60d0d"]')
    expect(firstGroupColors.length).toBeGreaterThan(0)
  })

  it('emits hover events', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    const firstGroup = wrapper.find('.group')
    await firstGroup.trigger('mouseenter')

    expect(wrapper.emitted('hover-apt')).toBeTruthy()
    expect(wrapper.emitted('hover-apt')?.[0]).toEqual(['apt-1'])

    await firstGroup.trigger('mouseleave')

    expect(wrapper.emitted('leave-apt')).toBeTruthy()
  })

  it('emits delete event', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    const deleteButton = wrapper.findAll('button').find(btn =>
      btn.attributes('title') === 'Delete'
    )
    expect(deleteButton).toBeTruthy()
    if (deleteButton) {
      await deleteButton.trigger('click')
    }

    expect(wrapper.emitted('delete-apt')).toBeTruthy()
    expect(wrapper.emitted('delete-apt')?.[0]).toEqual(['apt-1'])
  })

  it('handles keyboard events in edit mode', async () => {
    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mockAptGroups,
        activeIds: new Set(),
        totalGroups: 2
      }
    })

    // Enter edit mode
    const editButton = wrapper.findAll('button').find(btn =>
      btn.attributes('title') === 'Rename'
    )
    expect(editButton).toBeTruthy()
    if (editButton) {
      await editButton.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('New Name')

      // Test Enter key to save
      await input.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('rename-apt')).toBeTruthy()
      expect(wrapper.emitted('rename-apt')?.[0]).toEqual(['apt-1', 'New Name'])

      // Enter edit mode again for Escape test
      await editButton.trigger('click')
      const input2 = wrapper.find('input[type="text"]')
      await input2.setValue('Another Name')

      // Test Escape key to cancel
      await input2.trigger('keydown', { key: 'Escape' })
      // Should not emit rename-apt again
      expect(wrapper.emitted('rename-apt')?.length).toBe(1)
    }
  })

  it('shows threat level indicators correctly', () => {
    const mixedThreatGroups: AptGroup[] = [
      { ...mockAptGroups[0], threatLevel: 'high' },
      { ...mockAptGroups[1], threatLevel: 'medium', id: 'apt-medium' },
      { ...mockAptGroups[1], threatLevel: 'low', id: 'apt-low' },
      { ...mockAptGroups[1], threatLevel: 'mixed', id: 'apt-mixed' }
    ]

    const wrapper = mount(AptPanel, {
      props: {
        aptGroups: mixedThreatGroups,
        activeIds: new Set(),
        totalGroups: 4
      }
    })

    expect(wrapper.text()).toContain('HIGH')
    expect(wrapper.text()).toContain('MEDIUM')
    expect(wrapper.text()).toContain('LOW')
    expect(wrapper.text()).toContain('MIXED')
  })
})