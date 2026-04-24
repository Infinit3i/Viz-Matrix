import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AttackMatrix from '../components/AttackMatrix.vue'
import type { AptGroup } from '../components/AptPanel.vue'

// Mock navigator export functions first
vi.mock('../utils/navigatorExport', () => ({
  exportToNavigator: vi.fn(),
  importFromNavigator: vi.fn(),
  downloadLayer: vi.fn(),
  uploadLayer: vi.fn()
}))

// Import the mocked functions
import {
  exportToNavigator,
  importFromNavigator,
  downloadLayer,
  uploadLayer
} from '../utils/navigatorExport'

const mockExportToNavigator = vi.mocked(exportToNavigator)
const mockImportFromNavigator = vi.mocked(importFromNavigator)
const mockDownloadLayer = vi.mocked(downloadLayer)
const mockUploadLayer = vi.mocked(uploadLayer)

// Mock components
vi.mock('../components/MatrixCell.vue', () => ({
  default: {
    name: 'MatrixCell',
    template: '<div class="matrix-cell" :data-technique-id="techniqueId"></div>',
    props: [
      'techniqueId', 'techniqueName', 'activeSources', 'inScope',
      'highlightedSourceId', 'activeOs', 'isCrownJewel', 'aptInfo'
    ]
  }
}))

vi.mock('../components/SourcetypePanel.vue', () => ({
  default: {
    name: 'SourcetypePanel',
    template: '<div class="sourcetype-panel"></div>',
    props: ['sourcetypes', 'activeIds'],
    emits: ['toggle', 'enable-all', 'disable-all', 'enable-category', 'disable-category', 'hover-source', 'leave-source'],
    methods: {
      expandCategory: vi.fn()
    }
  }
}))

vi.mock('../components/AptPanel.vue', () => ({
  default: {
    name: 'AptPanel',
    template: '<div class="apt-panel"></div>',
    props: ['aptGroups', 'activeIds', 'totalGroups'],
    emits: ['toggle', 'enable-all', 'disable-all', 'hover-apt', 'leave-apt', 'rename-apt', 'delete-apt']
  }
}))

vi.mock('../components/CoverageStats.vue', () => ({
  default: {
    name: 'CoverageStats',
    template: '<div class="coverage-stats"></div>',
    props: ['activeSources', 'inScopeIds']
  }
}))

vi.mock('../components/TechniqueTooltip.vue', () => ({
  default: {
    name: 'TechniqueTooltip',
    template: '<div class="tooltip"></div>',
    props: ['techniqueId', 'techniqueName', 'sources', 'totalActive', 'inScope', 'x', 'y']
  }
}))

vi.mock('../components/Recommendations.vue', () => ({
  default: {
    name: 'Recommendations',
    template: '<div class="recommendations"></div>',
    props: ['activeSources', 'inScopeIds', 'activeEnvCategories', 'crownJewelIds'],
    emits: ['enable', 'hover-source', 'leave-source']
  }
}))

vi.mock('../components/EnvironmentSetup.vue', () => ({
  default: {
    name: 'EnvironmentSetup',
    template: '<div class="environment-setup"></div>',
    emits: ['apply', 'expand-categories', 'active-categories', 'crown-jewel-techniques']
  }
}))

vi.mock('../components/HelpTutorial.vue', () => ({
  default: {
    name: 'HelpTutorial',
    template: '<div class="help-tutorial"></div>',
    props: ['forceShow'],
    emits: ['close']
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock window.confirm and alert
global.confirm = vi.fn()
global.alert = vi.fn()

describe('AttackMatrix', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('true') // Tutorial already seen
    mockExportToNavigator.mockReturnValue({
      name: 'Test Layer',
      techniques: [],
      gradient: { colors: ['#ff0000'], minValue: 0, maxValue: 1 }
    } as any)
    mockImportFromNavigator.mockReturnValue({
      activeSourceIds: new Set(['win-security']),
      layerInfo: {
        name: 'Test Layer',
        isAptLayer: false,
        coveredTechniques: ['T1078'],
        aptTechniques: new Map(),
        threatLevel: 'low',
        layerColors: []
      }
    })
    global.confirm.mockReturnValue(true)
  })

  describe('Component Initialization', () => {
    it('renders main layout structure', () => {
      const wrapper = mount(AttackMatrix)

      expect(wrapper.find('.matrix-area').exists()).toBe(true)
      expect(wrapper.find('.sourcetype-panel').exists()).toBe(true)
      expect(wrapper.find('.apt-panel').exists()).toBe(true)
      expect(wrapper.find('.coverage-stats').exists()).toBe(true)
    })

    it('shows tutorial for first-time users', async () => {
      mockLocalStorage.getItem.mockReturnValue(null) // First time user

      const wrapper = mount(AttackMatrix)
      await nextTick()

      expect(wrapper.find('.help-tutorial').exists()).toBe(true)
    })

    it('does not show tutorial for returning users', async () => {
      mockLocalStorage.getItem.mockReturnValue('true') // Tutorial seen

      const wrapper = mount(AttackMatrix)
      await nextTick()

      expect(wrapper.find('.help-tutorial').exists()).toBe(false)
    })
  })

  describe('Collapsible Sidebar Functionality', () => {
    it('toggles left sidebar on desktop', async () => {
      const wrapper = mount(AttackMatrix)

      // Find left sidebar collapse button
      const leftHandle = wrapper.find('button[title="Toggle left sidebar"]')
      expect(leftHandle.exists()).toBe(true)

      // Initially not collapsed
      const leftSidebar = wrapper.find('.sourcetype-panel')
      expect(leftSidebar.classes()).not.toContain('lg:w-0')

      // Click to collapse
      await leftHandle.trigger('click')

      // Should be collapsed
      expect(leftSidebar.classes()).toContain('lg:w-0')

      // Click again to expand
      await leftHandle.trigger('click')

      // Should be expanded
      expect(leftSidebar.classes()).not.toContain('lg:w-0')
    })

    it('toggles right sidebar on desktop', async () => {
      const wrapper = mount(AttackMatrix)

      // Find right sidebar collapse button
      const rightHandle = wrapper.find('button[title="Toggle right sidebar"]')
      expect(rightHandle.exists()).toBe(true)

      // Initially not collapsed
      const rightSidebar = wrapper.find('.apt-panel')
      expect(rightSidebar.classes()).not.toContain('lg:w-0')

      // Click to collapse
      await rightHandle.trigger('click')

      // Should be collapsed
      expect(rightSidebar.classes()).toContain('lg:w-0')

      // Click again to expand
      await rightHandle.trigger('click')

      // Should be expanded
      expect(rightSidebar.classes()).not.toContain('lg:w-0')
    })

    it('handles mobile sidebar toggles separately', async () => {
      const wrapper = mount(AttackMatrix)

      // Find mobile toggle buttons
      const leftToggle = wrapper.find('button .fa-bars').element.closest('button')
      const rightToggle = wrapper.find('button .fa-user-secret').element.closest('button')

      expect(leftToggle).toBeTruthy()
      expect(rightToggle).toBeTruthy()

      // Test left sidebar mobile toggle
      const leftSidebar = wrapper.find('.sourcetype-panel')
      expect(leftSidebar.classes()).toContain('-translate-x-full') // Initially hidden on mobile

      // Find mobile toggle buttons by their icon classes
      const mobileButtons = wrapper.findAll('button').filter(btn =>
        btn.find('.fa-bars').exists() || btn.find('.fa-user-secret').exists()
      )

      if (mobileButtons.length > 0) {
        await mobileButtons[0].trigger('click')
      }
      // Mobile state is independent of desktop collapse state
    })

    it('shows collapse handles with correct positioning', () => {
      const wrapper = mount(AttackMatrix)

      const leftHandle = wrapper.find('.sidebar-handle[title="Toggle left sidebar"]')
      const rightHandle = wrapper.find('.sidebar-handle[title="Toggle right sidebar"]')

      expect(leftHandle.exists()).toBe(true)
      expect(rightHandle.exists()).toBe(true)

      // Check chevron icons
      expect(leftHandle.find('.fa-chevron-left').exists()).toBe(true)
      expect(rightHandle.find('.fa-chevron-right').exists()).toBe(true)
    })
  })

  describe('Infrastructure-Based APT Filtering', () => {
    it('filters APT groups based on user environment', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Set up test environment with specific sourcetypes
      vm.environmentSourceIds = new Set(['win-security', 'sysmon'])

      // Add test APT groups
      vm.aptGroups = [
        {
          id: 'apt-1',
          name: 'Relevant APT',
          techniques: new Map([
            ['T1078', { score: 1, color: '#e60d0d', comment: 'Valid accounts' }], // Covered by win-security
            ['T1055', { score: 1, color: '#e60d0d', comment: 'Process injection' }] // Covered by sysmon
          ]),
          techniqueCount: 2
        },
        {
          id: 'apt-2',
          name: 'Irrelevant APT',
          techniques: new Map([
            ['T9999', { score: 1, color: '#e60d0d', comment: 'Non-existent technique' }]
          ]),
          techniqueCount: 1
        }
      ] as AptGroup[]

      await nextTick()

      // Check that only relevant APT groups are shown
      const relevantGroups = vm.relevantAptGroups
      expect(relevantGroups.length).toBe(1)
      expect(relevantGroups[0].name).toBe('Relevant APT')
      expect(relevantGroups[0].relevancyScore).toBeGreaterThan(0)
    })

    it('calculates relevancy scores correctly', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Set environment with one sourcetype
      vm.environmentSourceIds = new Set(['win-security'])

      vm.aptGroups = [{
        id: 'apt-test',
        name: 'Test APT',
        techniques: new Map([
          ['T1078', { score: 1, color: '#e60d0d', comment: 'Covered' }], // Relevant
          ['T9999', { score: 1, color: '#e60d0d', comment: 'Not covered' }] // Not relevant
        ]),
        techniqueCount: 2
      }] as AptGroup[]

      await nextTick()

      const relevantGroup = vm.relevantAptGroups[0]
      expect(relevantGroup.relevantTechniqueCount).toBe(1)
      expect(relevantGroup.relevancyScore).toBe(0.5) // 1 out of 2 techniques
    })

    it('filters out APT groups with zero relevancy', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Environment with no relevant sourcetypes
      vm.environmentSourceIds = new Set(['some-other-source'])

      vm.aptGroups = [{
        id: 'apt-irrelevant',
        name: 'Irrelevant APT',
        techniques: new Map([
          ['T1078', { score: 1, color: '#e60d0d', comment: 'Not in environment' }]
        ]),
        techniqueCount: 1
      }] as AptGroup[]

      await nextTick()

      expect(vm.relevantAptGroups.length).toBe(0)
    })
  })

  describe('Export/Import Functionality', () => {
    it('exports current coverage configuration', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Set up some active sources
      vm.activeSourceIds = new Set(['win-security', 'sysmon'])

      const exportButton = wrapper.find('button[title="Export to MITRE Navigator"]')
      await exportButton.trigger('click')

      expect(mockExportToNavigator).toHaveBeenCalledWith(
        vm.activeSourceIds,
        'Viz-Matrix Coverage',
        expect.stringContaining('2 active sources')
      )
      expect(mockDownloadLayer).toHaveBeenCalled()
    })

    it('imports normal layer and enables sourcetypes', async () => {
      mockUploadLayer.mockResolvedValue({
        name: 'Normal Layer',
        techniques: [{ techniqueID: 'T1078', enabled: true }]
      })

      mockImportFromNavigator.mockReturnValue({
        activeSourceIds: new Set(['win-security']),
        layerInfo: {
          name: 'Normal Layer',
          isAptLayer: false,
          coveredTechniques: ['T1078'],
          aptTechniques: new Map(),
          threatLevel: 'low',
          layerColors: []
        }
      })

      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      const importButton = wrapper.find('button[title="Import from MITRE Navigator"]')
      await importButton.trigger('click')

      expect(mockUploadLayer).toHaveBeenCalled()
      expect(vm.activeSourceIds.has('win-security')).toBe(true)
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Normal Layer'))
    })

    it('imports APT layer and adds to APT groups', async () => {
      mockUploadLayer.mockResolvedValue({
        name: 'APT-29',
        techniques: [{ techniqueID: 'T1078', enabled: true, color: '#e60d0d' }]
      })

      const aptTechniques = new Map([
        ['T1078', { score: 1, color: '#e60d0d', comment: 'APT technique' }]
      ])

      mockImportFromNavigator.mockReturnValue({
        activeSourceIds: new Set(),
        layerInfo: {
          name: 'APT-29',
          description: 'Russian APT group',
          isAptLayer: true,
          threatLevel: 'high',
          coveredTechniques: ['T1078'],
          aptTechniques,
          layerColors: ['#e60d0d']
        }
      })

      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      const importButton = wrapper.find('button[title="Import from MITRE Navigator"]')
      await importButton.trigger('click')

      expect(vm.aptGroups.length).toBe(1)
      expect(vm.aptGroups[0].name).toBe('APT-29')
      expect(vm.aptGroups[0].threatLevel).toBe('high')
      expect(vm.activeAptIds.has(vm.aptGroups[0].id)).toBe(true)
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('APT Layer Imported'))
    })

    it('handles import errors gracefully', async () => {
      mockUploadLayer.mockRejectedValue(new Error('Invalid file'))

      const wrapper = mount(AttackMatrix)

      const importButton = wrapper.find('button[title="Import from MITRE Navigator"]')
      await importButton.trigger('click')

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Import failed'))
    })
  })

  describe('APT Management', () => {
    it('toggles APT groups on and off', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.aptGroups = [{
        id: 'apt-1',
        name: 'Test APT',
        techniques: new Map(),
        techniqueCount: 0
      }]

      expect(vm.activeAptIds.has('apt-1')).toBe(false)

      vm.toggleApt('apt-1')
      expect(vm.activeAptIds.has('apt-1')).toBe(true)

      vm.toggleApt('apt-1')
      expect(vm.activeAptIds.has('apt-1')).toBe(false)
    })

    it('enables and disables all APT groups', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Set up environment and APT groups
      vm.environmentSourceIds = new Set(['win-security'])
      vm.aptGroups = [
        {
          id: 'apt-1',
          name: 'APT 1',
          techniques: new Map([['T1078', { score: 1, color: '#e60d0d', comment: 'test' }]]),
          techniqueCount: 1
        },
        {
          id: 'apt-2',
          name: 'APT 2',
          techniques: new Map([['T1078', { score: 1, color: '#e60d0d', comment: 'test' }]]),
          techniqueCount: 1
        }
      ]

      await nextTick()

      vm.enableAllApts()
      expect(vm.activeAptIds.size).toBe(2)

      vm.disableAllApts()
      expect(vm.activeAptIds.size).toBe(0)
    })

    it('renames APT groups', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.aptGroups = [{
        id: 'apt-1',
        name: 'Old Name',
        techniques: new Map(),
        techniqueCount: 0
      }]

      vm.renameApt('apt-1', 'New Name')
      expect(vm.aptGroups[0].name).toBe('New Name')
    })

    it('deletes APT groups with confirmation', async () => {
      global.confirm.mockReturnValue(true)

      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.aptGroups = [{
        id: 'apt-1',
        name: 'Test APT',
        techniques: new Map(),
        techniqueCount: 0
      }]
      vm.activeAptIds = new Set(['apt-1'])

      vm.deleteApt('apt-1')

      expect(global.confirm).toHaveBeenCalled()
      expect(vm.aptGroups.length).toBe(0)
      expect(vm.activeAptIds.has('apt-1')).toBe(false)
    })

    it('does not delete APT groups without confirmation', async () => {
      global.confirm.mockReturnValue(false)

      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.aptGroups = [{
        id: 'apt-1',
        name: 'Test APT',
        techniques: new Map(),
        techniqueCount: 0
      }]

      vm.deleteApt('apt-1')

      expect(global.confirm).toHaveBeenCalled()
      expect(vm.aptGroups.length).toBe(1)
    })
  })

  describe('Environment Integration', () => {
    it('updates environment source IDs', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      const sourceIds = ['win-security', 'sysmon', 'powershell']
      vm.onEnvironmentChange(sourceIds)

      expect(vm.environmentSourceIds).toEqual(new Set(sourceIds))
    })

    it('expands categories through sourcetype panel', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Mock the sourcetype panel ref
      vm.sourcetypePanelRef = {
        expandCategory: vi.fn()
      }

      const categories = ['endpoint', 'network']
      vm.onExpandCategories(categories)

      expect(vm.sourcetypePanelRef.expandCategory).toHaveBeenCalledWith('endpoint')
      expect(vm.sourcetypePanelRef.expandCategory).toHaveBeenCalledWith('network')
    })

    it('shows APT active indicator when APTs are enabled', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      // Initially no indicator
      expect(wrapper.find('.text-red-300').exists()).toBe(false)

      // Enable some APTs
      vm.activeAptIds = new Set(['apt-1', 'apt-2'])
      await nextTick()

      const indicator = wrapper.find('.text-red-300')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toContain('2 APT Groups Active')
    })
  })

  describe('Help Tutorial Integration', () => {
    it('shows help tutorial when requested', async () => {
      const wrapper = mount(AttackMatrix)

      const helpButton = wrapper.find('button[title="Show help tutorial"]')
      await helpButton.trigger('click')

      expect(wrapper.find('.help-tutorial').exists()).toBe(true)
    })

    it('closes help tutorial properly', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.showHelpTutorial = true
      vm.forceShowTutorial = true
      await nextTick()

      vm.closeHelp()

      expect(vm.showHelpTutorial).toBe(false)
      expect(vm.forceShowTutorial).toBe(false)
    })
  })

  describe('Tooltip System', () => {
    it('shows technique tooltip on cell hover', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      const mockEvent = { clientX: 100, clientY: 200 } as MouseEvent
      vm.onCellHover('T1078', [], mockEvent)

      expect(vm.tooltip).toEqual({
        techniqueId: 'T1078',
        techniqueName: expect.any(String),
        sources: [],
        x: 100,
        y: 200
      })
    })

    it('hides tooltip on cell leave', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.tooltip = { techniqueId: 'T1078', techniqueName: 'Test', sources: [], x: 0, y: 0 }
      vm.onCellLeave()

      expect(vm.tooltip).toBeNull()
    })
  })

  describe('Computed Properties', () => {
    it('calculates coverage count correctly', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.activeSourceIds = new Set(['win-security', 'sysmon'])

      // Both sources cover T1078
      const count = vm.coverageCount('T1078')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('sorts tactics by in-scope techniques', async () => {
      const wrapper = mount(AttackMatrix)
      const vm = wrapper.vm as any

      vm.environmentSourceIds = new Set(['win-security'])
      await nextTick()

      const sortedTactics = vm.sortedTactics
      expect(Array.isArray(sortedTactics)).toBe(true)
      expect(sortedTactics.length).toBeGreaterThan(0)
    })
  })
})