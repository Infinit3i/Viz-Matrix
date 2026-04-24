import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MatrixCell from '../components/MatrixCell.vue'
import type { Sourcetype } from '../data/sourcetypes'

// Mock window.open
global.window.open = vi.fn()

describe('MatrixCell', () => {
  const mockSourcetypes: Sourcetype[] = [
    {
      id: 'win-security',
      name: 'Security Event Log',
      category: 'windows',
      color: '#3b82f6',
      description: 'Windows Security Event Log',
      techniqueIds: ['T1078', 'T1003']
    },
    {
      id: 'sysmon',
      name: 'Sysmon',
      category: 'edr',
      color: '#059669',
      description: 'Sysmon process monitoring',
      techniqueIds: ['T1078', 'T1055']
    },
    {
      id: 'linux-auth',
      name: 'Linux Auth Log',
      category: 'linux',
      color: '#dc2626',
      description: 'Linux authentication logs',
      techniqueIds: ['T1021']
    }
  ]

  const baseProps = {
    techniqueId: 'T1078',
    techniqueName: 'Valid Accounts',
    activeSources: [],
    inScope: true,
    highlightedSourceId: null,
    activeOs: ['windows'],
    isCrownJewel: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Coverage Calculation', () => {
    it('calculates zero coverage correctly', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [] // No active sources
        }
      })
      const vm = wrapper.vm as any

      expect(vm.coverageCount).toBe(0)
      expect(vm.matchingSources).toEqual([])
    })

    it('calculates single coverage correctly', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0]] // Only win-security covers T1078
        }
      })
      const vm = wrapper.vm as any

      expect(vm.coverageCount).toBe(1)
      expect(vm.matchingSources).toHaveLength(1)
      expect(vm.matchingSources[0].id).toBe('win-security')
    })

    it('calculates multiple coverage correctly', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0], mockSourcetypes[1]] // Both cover T1078
        }
      })
      const vm = wrapper.vm as any

      expect(vm.coverageCount).toBe(2)
      expect(vm.matchingSources).toHaveLength(2)
    })

    it('filters sources that do not cover technique', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          techniqueId: 'T1021', // Only covered by linux-auth
          activeSources: mockSourcetypes
        }
      })
      const vm = wrapper.vm as any

      expect(vm.coverageCount).toBe(1)
      expect(vm.matchingSources[0].id).toBe('linux-auth')
    })
  })

  describe('Color Mapping', () => {
    it('shows N/A color for out-of-scope techniques', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          inScope: false
        }
      })
      const vm = wrapper.vm as any

      expect(vm.cellColor).toBe('rgba(39, 39, 42, 0.2)')
    })

    it('shows red color for blind spots', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [] // No coverage
        }
      })
      const vm = wrapper.vm as any

      expect(vm.cellColor).toBe('rgba(220, 50, 40, 0.85)')
      expect(vm.isBlindSpot).toBe(true)
    })

    it('shows yellow color for single coverage', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0]] // Single source
        }
      })
      const vm = wrapper.vm as any

      expect(vm.cellColor).toBe('rgba(210, 180, 40, 0.85)')
    })

    it('shows green color for multiple coverage', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0], mockSourcetypes[1]] // Multiple sources
        }
      })
      const vm = wrapper.vm as any

      expect(vm.cellColor).toBe('rgba(30, 200, 80, 0.9)')
    })

    it('overrides color for APT techniques', () => {
      const aptInfo = { score: 3, color: '#e60d0d', comment: 'APT technique' }

      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          aptInfo,
          activeSources: [mockSourcetypes[0]] // Would normally be yellow
        }
      })
      const vm = wrapper.vm as any

      expect(vm.cellColor).toBe('#e60d0dCC') // APT color + transparency
    })
  })

  describe('Multi-OS Functionality', () => {
    it('detects single OS environment', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeOs: ['windows']
        }
      })
      const vm = wrapper.vm as any

      expect(vm.relevantOs).toContain('windows')
      expect(vm.hasMultipleOs).toBe(false)
    })

    it('detects multi-OS environment', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeOs: ['windows', 'linux']
        }
      })
      const vm = wrapper.vm as any

      expect(vm.relevantOs).toContain('windows')
      expect(vm.relevantOs).toContain('linux')
      expect(vm.hasMultipleOs).toBe(true)
    })

    it('calculates per-OS coverage correctly', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          techniqueId: 'T1078', // Covered by windows sources but not linux
          activeOs: ['windows', 'linux'],
          activeSources: [mockSourcetypes[0]] // win-security only
        }
      })
      const vm = wrapper.vm as any

      const coverage = vm.osCoverage
      const windowsCoverage = coverage.find((c: any) => c.os === 'windows')
      const linuxCoverage = coverage.find((c: any) => c.os === 'linux')

      expect(windowsCoverage?.covered).toBe(true)
      expect(linuxCoverage?.covered).toBe(false)
    })

    it('shows multi-OS split view when applicable', async () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeOs: ['windows', 'linux'],
          activeSources: [mockSourcetypes[0]]
        }
      })

      // Should show flex container for multi-OS
      const multiOsContainer = wrapper.find('.flex-col')
      expect(multiOsContainer.exists()).toBe(true)

      // Should have OS labels for uncovered segments
      const osLabels = wrapper.findAll('.text-\\[6px\\]')
      expect(osLabels.length).toBeGreaterThan(0)
    })

    it('shows single view for single OS', async () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeOs: ['windows'],
          activeSources: []
        }
      })

      // Should not show multi-OS container
      expect(wrapper.find('.flex-col').exists()).toBe(false)

      // Should show single view with technique ID for blind spot
      expect(wrapper.text()).toContain('T1078')
    })
  })

  describe('Crown Jewel Highlighting', () => {
    it('applies crown jewel outline for blind spots', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          isCrownJewel: true,
          activeSources: [] // Blind spot
        }
      })

      const cell = wrapper.find('.cell-hover')
      const style = cell.attributes('style')

      expect(style).toContain('outline: 2px solid rgba(245, 158, 11, 0.8)')
      expect(style).toContain('box-shadow: 0 0 10px rgba(245, 158, 11, 0.4)')
    })

    it('applies lighter crown jewel outline for covered techniques', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          isCrownJewel: true,
          activeSources: [mockSourcetypes[0]] // Covered
        }
      })

      const cell = wrapper.find('.cell-hover')
      const style = cell.attributes('style')

      expect(style).toContain('outline: 1px solid rgba(245, 158, 11, 0.35)')
    })

    it('includes crown jewel indicator in status label', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          isCrownJewel: true,
          activeSources: []
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toContain('[CROWN JEWEL]')
    })
  })

  describe('APT Technique Display', () => {
    const aptInfo = { score: 3, color: '#e60d0d', comment: 'Used by APT-29' }

    it('shows APT indicator icon', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          aptInfo,
          activeSources: [mockSourcetypes[0]]
        }
      })

      const aptIcon = wrapper.find('.fa-exclamation-triangle')
      expect(aptIcon.exists()).toBe(true)
    })

    it('displays APT score instead of coverage count', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          aptInfo,
          activeSources: [mockSourcetypes[0], mockSourcetypes[1]] // 2 sources
        }
      })

      // Should show APT score (3) not coverage count (2)
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).not.toContain('2')
    })

    it('includes APT info in status label', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          aptInfo
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toContain('APT TECHNIQUE')
      expect(vm.statusLabel).toContain('Used by APT-29')
    })

    it('applies APT color to multi-OS segments', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          aptInfo,
          activeOs: ['windows', 'linux'],
          activeSources: [mockSourcetypes[0]]
        }
      })
      const vm = wrapper.vm as any

      const windowsSegment = vm.segmentColor(true) // Covered segment
      expect(windowsSegment).toBe('#e60d0dCC') // APT color + transparency
    })
  })

  describe('Highlighting System', () => {
    it('highlights when source is hovered', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          highlightedSourceId: 'win-security' // This source covers T1078
        }
      })
      const vm = wrapper.vm as any

      expect(vm.isHighlighted).toBe(true)
      expect(vm.highlightColor).toBe('#3b82f6') // win-security color

      const cell = wrapper.find('.cell-hover')
      const style = cell.attributes('style')
      expect(style).toContain('outline: 2px solid #3b82f6')
    })

    it('does not highlight when source does not cover technique', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          techniqueId: 'T9999', // Not covered by any source
          highlightedSourceId: 'win-security'
        }
      })
      const vm = wrapper.vm as any

      expect(vm.isHighlighted).toBe(false)
    })
  })

  describe('Interaction Behaviors', () => {
    it('emits hover event on mouse enter', async () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0]]
        }
      })

      await wrapper.trigger('mouseenter')

      expect(wrapper.emitted('hover')).toBeTruthy()
      expect(wrapper.emitted('hover')?.[0]).toEqual([
        'T1078',
        [mockSourcetypes[0]]
      ])
    })

    it('emits leave event on mouse leave', async () => {
      const wrapper = mount(MatrixCell, {
        props: baseProps
      })

      await wrapper.trigger('mouseleave')

      expect(wrapper.emitted('leave')).toBeTruthy()
    })

    it('opens MITRE URL when blind spot is clicked', async () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [] // Blind spot
        }
      })

      await wrapper.trigger('click')

      expect(global.window.open).toHaveBeenCalledWith(
        'https://attack.mitre.org/techniques/T1078/',
        '_blank',
        'noopener'
      )
    })

    it('does not open URL when covered technique is clicked', async () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0]] // Covered
        }
      })

      await wrapper.trigger('click')

      expect(global.window.open).not.toHaveBeenCalled()
    })

    it('shows pointer cursor for blind spots', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [] // Blind spot
        }
      })

      expect(wrapper.classes()).toContain('cursor-pointer')
    })

    it('shows default cursor for covered techniques', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0]] // Covered
        }
      })

      expect(wrapper.classes()).toContain('cursor-default')
    })
  })

  describe('URL Generation', () => {
    it('generates correct URL for main techniques', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          techniqueId: 'T1078'
        }
      })
      const vm = wrapper.vm as any

      expect(vm.mitreUrl).toBe('https://attack.mitre.org/techniques/T1078/')
    })

    it('generates correct URL for sub-techniques', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          techniqueId: 'T1078.001'
        }
      })
      const vm = wrapper.vm as any

      expect(vm.mitreUrl).toBe('https://attack.mitre.org/techniques/T1078/001/')
    })
  })

  describe('Status Labels', () => {
    it('shows N/A for out-of-scope techniques', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          inScope: false
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toBe('N/A')
    })

    it('shows blind spot status', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: []
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toBe('Blind Spot')
    })

    it('shows single point of failure warning', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0]]
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toBe('1 source — single point of failure')
    })

    it('shows multiple sources status', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: [mockSourcetypes[0], mockSourcetypes[1]]
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toBe('2 sources')
    })

    it('shows partial coverage for multi-OS', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeOs: ['windows', 'linux'],
          activeSources: [mockSourcetypes[0]] // Only covers windows
        }
      })
      const vm = wrapper.vm as any

      expect(vm.statusLabel).toContain('Partial — missing: linux')
    })
  })

  describe('Visual Styling', () => {
    it('has correct dimensions on mobile and desktop', () => {
      const wrapper = mount(MatrixCell, {
        props: baseProps
      })

      const cell = wrapper.find('.cell-hover')
      const cellClass = cell.classes().join(' ')
      expect(cellClass).toContain('h-[14px]')
      expect(cellClass).toContain('lg:h-[28px]')
    })

    it('shows tooltip with technique information', () => {
      const wrapper = mount(MatrixCell, {
        props: {
          ...baseProps,
          activeSources: []
        }
      })

      const cell = wrapper.find('.cell-hover')
      const title = cell.attributes('title')

      expect(title).toContain('T1078: Valid Accounts')
      expect(title).toContain('Blind Spot')
    })
  })
})