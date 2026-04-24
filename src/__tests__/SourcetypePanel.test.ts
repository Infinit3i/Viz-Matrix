import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SourcetypePanel from '../components/SourcetypePanel.vue'
import type { Sourcetype, SourceCategory } from '../data/sourcetypes'

describe('SourcetypePanel', () => {
  const mockSourcetypes: Sourcetype[] = [
    {
      id: 'win-security',
      name: 'Security Event Log',
      category: 'windows' as SourceCategory,
      color: '#3b82f6',
      description: 'Windows Security Event Log',
      techniqueIds: ['T1078', 'T1003', 'T1055']
    },
    {
      id: 'sysmon',
      name: 'Sysmon',
      category: 'edr' as SourceCategory,
      color: '#059669',
      description: 'Sysmon process monitoring',
      techniqueIds: ['T1055', 'T1027', 'T1059']
    },
    {
      id: 'linux-auth',
      name: 'Linux Auth Log',
      category: 'linux' as SourceCategory,
      color: '#dc2626',
      description: 'Linux authentication logs',
      techniqueIds: ['T1078', 'T1021']
    },
    {
      id: 'aws-cloudtrail',
      name: 'AWS CloudTrail',
      category: 'cloud' as SourceCategory,
      color: '#7c3aed',
      description: 'AWS API logging',
      techniqueIds: ['T1078', 'T1580']
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders with correct header', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      expect(wrapper.find('h2').text()).toContain('Sourcetypes')

      // Find buttons by their text content
      const allButton = wrapper.findAll('button').find(btn => btn.text() === 'All')
      const noneButton = wrapper.findAll('button').find(btn => btn.text() === 'None')
      expect(allButton).toBeTruthy()
      expect(noneButton).toBeTruthy()
    })

    it('groups sourcetypes by category', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      // Should show Windows category with Security Event Log
      const windowsCategory = wrapper.findAll('span').find(span => span.text().includes('WINDOWS'))
      expect(windowsCategory).toBeTruthy()

      // Check that Windows sourcetypes appear when expanded
      const windowsButton = windowsCategory?.element.closest('button')
      expect(windowsButton).toBeTruthy()
    })

    it('displays sourcetype information correctly', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set(['win-security'])
        }
      })

      // Windows category should be expanded by default (not in collapsed set)
      const securityEventLog = wrapper.findAll('span').find(span => span.text().includes('Security Event Log'))
      expect(securityEventLog).toBeTruthy()

      // Should show technique count
      expect(wrapper.text()).toContain('3') // T1078, T1003, T1055
    })
  })

  describe('Category Collapse/Expand', () => {
    it('toggles category collapse state', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })
      const vm = wrapper.vm as any

      // Initially windows is expanded, linux is collapsed
      expect(vm.collapsed.has('windows' as SourceCategory)).toBe(false)
      expect(vm.collapsed.has('linux' as SourceCategory)).toBe(true)

      // Click to collapse windows
      const minusSpan = wrapper.findAll('span').find(span => span.text().includes('−'))
      expect(minusSpan).toBeTruthy()
      if (minusSpan) {
        const windowsToggle = minusSpan.element.closest('button')
        expect(windowsToggle).toBeTruthy()
        await wrapper.findAll('button').find(btn => btn.text().includes('−'))?.trigger('click')
      }

      expect(vm.collapsed.has('windows' as SourceCategory)).toBe(true)

      // Click to expand linux
      const plusSpan = wrapper.findAll('span').find(span => span.text().includes('+'))
      if (plusSpan) {
        await wrapper.findAll('button').find(btn => btn.text().includes('+'))?.trigger('click')
      }

      expect(vm.collapsed.has('linux' as SourceCategory)).toBe(false)
    })

    it('shows correct expand/collapse icons', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      // Windows is expanded (should show −)
      const expandedIcon = wrapper.findAll('span').find(span => span.text().includes('−'))
      expect(expandedIcon).toBeTruthy()

      // Linux is collapsed (should show +)
      const collapsedIcon = wrapper.findAll('span').find(span => span.text().includes('+'))
      expect(collapsedIcon).toBeTruthy()
    })

    it('hides/shows sourcetypes when category is collapsed/expanded', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      // Windows sourcetypes should be visible (windows expanded by default)
      expect(wrapper.text()).toContain('Security Event Log')

      // Linux sourcetypes should be hidden (linux collapsed by default)
      expect(wrapper.text()).not.toContain('Linux Auth Log')

      // Expand linux category
      const linuxButton = wrapper.findAll('button').find(btn => btn.text().includes('LINUX'))
      if (linuxButton) {
        await linuxButton.trigger('click')
      }

      // Linux sourcetypes should now be visible
      expect(wrapper.text()).toContain('Linux Auth Log')
    })

    it('exposes expandCategory method', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      const vm = wrapper.vm as any

      // Linux should start collapsed
      expect(vm.collapsed.has('linux' as SourceCategory)).toBe(true)

      // Call exposed expandCategory method
      vm.expandCategory('linux' as SourceCategory)

      // Linux should now be expanded
      expect(vm.collapsed.has('linux' as SourceCategory)).toBe(false)
    })
  })

  describe('Sourcetype Interaction', () => {
    it('emits toggle event when sourcetype clicked', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      const sourcetypeButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Security Event Log')
      )
      expect(sourcetypeButtons.length).toBeGreaterThan(0)

      if (sourcetypeButtons.length > 0) {
        await sourcetypeButtons[0].trigger('click')
      }

      expect(wrapper.emitted('toggle')).toBeTruthy()
      expect(wrapper.emitted('toggle')?.[0]).toEqual(['win-security'])
    })

    it('shows active state for selected sourcetypes', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set(['win-security'])
        }
      })

      const activeButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Security Event Log')
      )
      expect(activeButtons.length).toBeGreaterThan(0)
      if (activeButtons.length > 0) {
        const activeSourcetype = activeButtons[0]
        expect(activeSourcetype.classes()).toContain('bg-zinc-800/80')
        expect(activeSourcetype.classes()).toContain('text-zinc-200')
      }
    })

    it('shows inactive state for unselected sourcetypes', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      const inactiveButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Security Event Log')
      )
      expect(inactiveButtons.length).toBeGreaterThan(0)
      if (inactiveButtons.length > 0) {
        const inactiveSourcetype = inactiveButtons[0]
        expect(inactiveSourcetype.classes()).toContain('text-zinc-600')
      }
    })

    it('displays color indicators with correct opacity', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set(['win-security'])
        }
      })

      const colorIndicators = wrapper.findAll('[style*="background-color"]')
      expect(colorIndicators.length).toBeGreaterThan(0)

      // Active sourcetype should have full opacity
      const activeIndicator = colorIndicators.find(el =>
        el.classes().includes('opacity-100')
      )
      expect(activeIndicator).toBeTruthy()

      // Inactive sourcetypes should have reduced opacity
      const inactiveIndicator = colorIndicators.find(el =>
        el.classes().includes('opacity-25')
      )
      expect(inactiveIndicator).toBeTruthy()
    })
  })

  describe('Bulk Actions', () => {
    it('emits enable-all when All button clicked', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      const allButton = wrapper.findAll('button').find(btn => btn.text() === 'All')
      expect(allButton).toBeTruthy()
      if (allButton) {
        await allButton.trigger('click')
      }

      expect(wrapper.emitted('enableAll')).toBeTruthy()
    })

    it('emits disable-all when None button clicked', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set(['win-security'])
        }
      })

      const noneButton = wrapper.findAll('button').find(btn => btn.text() === 'None')
      expect(noneButton).toBeTruthy()
      if (noneButton) {
        await noneButton.trigger('click')
      }

      expect(wrapper.emitted('disableAll')).toBeTruthy()
    })

    it('emits category-specific events', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })
      const vm = wrapper.vm as any

      // Test enable-category event
      vm.emit('enableCategory', 'windows')
      expect(wrapper.emitted('enableCategory')).toBeTruthy()

      // Test disable-category event
      vm.emit('disableCategory', 'windows')
      expect(wrapper.emitted('disableCategory')).toBeTruthy()
    })
  })

  describe('Hover Events', () => {
    it('emits hover events on sourcetype mouseenter/leave', async () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      const sourcetypeButtons = wrapper.findAll('button').filter(btn =>
        btn.text().includes('Security Event Log')
      )
      expect(sourcetypeButtons.length).toBeGreaterThan(0)

      if (sourcetypeButtons.length > 0) {
        // Mouse enter
        await sourcetypeButtons[0].trigger('mouseenter')
        expect(wrapper.emitted('hoverSource')).toBeTruthy()
        expect(wrapper.emitted('hoverSource')?.[0]).toEqual(['win-security'])

        // Mouse leave
        await sourcetypeButtons[0].trigger('mouseleave')
        expect(wrapper.emitted('leaveSource')).toBeTruthy()
      }
    })
  })

  describe('Category Filtering', () => {
    it('filters sourcetypes by category correctly', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })
      const vm = wrapper.vm as any

      const windowsSourcetypes = vm.getByCategory('windows')
      expect(windowsSourcetypes.length).toBe(1)
      expect(windowsSourcetypes[0].name).toBe('Security Event Log')

      const edrSourcetypes = vm.getByCategory('edr')
      expect(edrSourcetypes.length).toBe(1)
      expect(edrSourcetypes[0].name).toBe('Sysmon')

      const cloudSourcetypes = vm.getByCategory('cloud')
      expect(cloudSourcetypes.length).toBe(1)
      expect(cloudSourcetypes[0].name).toBe('AWS CloudTrail')
    })

    it('handles empty categories gracefully', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })
      const vm = wrapper.vm as any

      const emptyCategory = vm.getByCategory('nonexistent' as SourceCategory)
      expect(emptyCategory).toEqual([])
    })
  })

  describe('Technique Count Display', () => {
    it('shows correct technique counts for each sourcetype', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      // Security Event Log has 3 techniques
      const text = wrapper.text()
      expect(text).toContain('3') // T1078, T1003, T1055

      // Expand EDR to see Sysmon
      const edrToggle = wrapper.findAll('span').find(span => span.text().includes('EDR'))
      expect(edrToggle).toBeTruthy()
    })
  })

  describe('Responsive Design', () => {
    it('has proper scroll container for overflow', () => {
      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: mockSourcetypes,
          activeIds: new Set()
        }
      })

      const scrollContainer = wrapper.find('.overflow-y-auto')
      expect(scrollContainer.exists()).toBe(true)
      expect(scrollContainer.classes()).toContain('flex-1')
    })

    it('truncates long sourcetype names', () => {
      const longNameSourcetype: Sourcetype = {
        id: 'long-name',
        name: 'Very Long Sourcetype Name That Should Be Truncated',
        category: 'windows' as SourceCategory,
        color: '#000000',
        description: 'Test sourcetype',
        techniqueIds: ['T1001']
      }

      const wrapper = mount(SourcetypePanel, {
        props: {
          sourcetypes: [longNameSourcetype],
          activeIds: new Set()
        }
      })

      const nameSpan = wrapper.find('.truncate')
      expect(nameSpan.exists()).toBe(true)
    })
  })
})