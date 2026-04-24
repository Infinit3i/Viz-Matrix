import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import HelpTutorial from '../components/HelpTutorial.vue'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
}

// Mock document methods
const mockScrollIntoView = vi.fn()
const mockQuerySelector = vi.fn()
const mockQuerySelectorAll = vi.fn()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector
})

Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll
})

describe('HelpTutorial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null) // First time user
    mockQuerySelectorAll.mockReturnValue([])

    // Mock element for highlighting
    const mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      scrollIntoView: mockScrollIntoView
    }
    mockQuerySelector.mockReturnValue(mockElement)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('shows tutorial for first-time users', async () => {
    mockLocalStorage.getItem.mockReturnValue(null) // No tutorial seen

    const wrapper = mount(HelpTutorial)
    await nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.text()).toContain('Attack Matrix (Center)')
  })

  it('does not show tutorial if already seen', async () => {
    mockLocalStorage.getItem.mockReturnValue('true') // Tutorial already seen

    const wrapper = mount(HelpTutorial)
    await nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('shows tutorial when forced via prop', async () => {
    mockLocalStorage.getItem.mockReturnValue('true') // Tutorial already seen

    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('navigates through tutorial steps correctly', async () => {
    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Should start at step 1 (Attack Matrix)
    expect(wrapper.text()).toContain('Attack Matrix (Center)')
    expect(wrapper.text()).toContain('1/4')

    // Click Next
    const nextButton = wrapper.findAll('button').find(btn => btn.text() === 'Next')
    expect(nextButton).toBeTruthy()
    if (nextButton) {
      await nextButton.trigger('click')
    }

    // Should be at step 2 (Detection Capabilities)
    expect(wrapper.text()).toContain('Detection Capabilities (Left)')
    expect(wrapper.text()).toContain('2/4')

    // Click Next again
    const nextButton2 = wrapper.findAll('button').find(btn => btn.text() === 'Next')
    if (nextButton2) {
      await nextButton2.trigger('click')
    }

    // Should be at step 3 (Threat Intelligence)
    expect(wrapper.text()).toContain('Threat Intelligence (Right)')
    expect(wrapper.text()).toContain('3/4')

    // Click Next again
    const nextButton3 = wrapper.findAll('button').find(btn => btn.text() === 'Next')
    if (nextButton3) {
      await nextButton3.trigger('click')
    }

    // Should be at step 4 (Import & Export)
    expect(wrapper.text()).toContain('Import & Export')
    expect(wrapper.text()).toContain('4/4')

    // Button should now say "Finish"
    expect(wrapper.text()).toContain('Finish')
  })

  it('closes tutorial when finish button clicked', async () => {
    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Navigate to last step
    const component = wrapper.vm as any
    component.currentStep = 3 // Last step (0-indexed)
    await nextTick()

    // Click Finish
    const finishButton = wrapper.findAll('button').find(btn => btn.text() === 'Finish')
    expect(finishButton).toBeTruthy()
    if (finishButton) {
      await finishButton.trigger('click')
    }

    // Should emit close event
    expect(wrapper.emitted('close')).toBeTruthy()

    // Should save to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('viz-matrix-tutorial-seen', 'true')
  })

  it('closes tutorial when X button clicked', async () => {
    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Find close button by looking for the times icon
    const closeButtons = wrapper.findAll('button').filter(button =>
      button.find('.fa-times').exists()
    )

    if (closeButtons.length > 0) {
      await closeButtons[0].trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    } else {
      // Fallback: find button with × text
      const xButton = wrapper.findAll('button').find(btn => btn.text().includes('×'))
      if (xButton) {
        await xButton.trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
      }
    }
  })

  it('highlights target elements correctly', async () => {
    const mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      scrollIntoView: mockScrollIntoView
    }

    mockQuerySelector.mockReturnValue(mockElement)
    mockQuerySelectorAll.mockReturnValue([])

    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Should query for the matrix area
    expect(mockQuerySelector).toHaveBeenCalledWith('.matrix-area')

    // Should add highlight class
    expect(mockElement.classList.add).toHaveBeenCalledWith('tutorial-highlight')

    // Should scroll into view
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center'
    })
  })

  it('removes existing highlights before adding new ones', async () => {
    const existingHighlight = {
      classList: {
        remove: vi.fn()
      }
    }

    mockQuerySelectorAll.mockReturnValue([existingHighlight])

    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Should remove highlights from existing elements
    expect(existingHighlight.classList.remove).toHaveBeenCalledWith('tutorial-highlight')
  })

  it('cleans up highlights on unmount', () => {
    const mockElements = [
      { classList: { remove: vi.fn() } },
      { classList: { remove: vi.fn() } }
    ]

    mockQuerySelectorAll.mockReturnValue(mockElements)

    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })

    wrapper.unmount()

    // Should clean up highlights
    mockElements.forEach(el => {
      expect(el.classList.remove).toHaveBeenCalledWith('tutorial-highlight')
    })
  })

  it('shows correct step titles and descriptions', async () => {
    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    const expectedSteps = [
      {
        title: 'Attack Matrix (Center)',
        description: 'This matrix represents YOUR attack surface'
      },
      {
        title: 'Detection Capabilities (Left)',
        description: 'Select what you can SEE'
      },
      {
        title: 'Threat Intelligence (Right)',
        description: 'See what ATTACKS you'
      },
      {
        title: 'Import & Export',
        description: 'Import MITRE Navigator layers'
      }
    ]

    for (let i = 0; i < expectedSteps.length; i++) {
      const component = wrapper.vm as any
      component.currentStep = i
      await nextTick()

      expect(wrapper.text()).toContain(expectedSteps[i].title)
      expect(wrapper.text()).toContain(expectedSteps[i].description)
    }
  })

  it('shows correct progress indicators', async () => {
    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Test each step's progress
    for (let i = 0; i < 4; i++) {
      const component = wrapper.vm as any
      component.currentStep = i
      await nextTick()

      expect(wrapper.text()).toContain(`${i + 1}/4`)
    }
  })

  it('handles missing target elements gracefully', async () => {
    mockQuerySelector.mockReturnValue(null) // Element not found

    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Should not throw error and tutorial should still show
    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.text()).toContain('Attack Matrix (Center)')
  })

  it('emits close event with proper cleanup', async () => {
    const mockElements = [
      { classList: { remove: vi.fn() } }
    ]
    mockQuerySelectorAll.mockReturnValue(mockElements)

    const wrapper = mount(HelpTutorial, {
      props: {
        forceShow: true
      }
    })
    await nextTick()

    // Navigate to last step and finish
    const component = wrapper.vm as any
    component.currentStep = 3
    await nextTick()

    const finishButton = wrapper.findAll('button').find(btn => btn.text() === 'Finish')
    expect(finishButton).toBeTruthy()
    if (finishButton) {
      await finishButton.trigger('click')
    }

    // Should clean up highlights
    expect(mockElements[0].classList.remove).toHaveBeenCalledWith('tutorial-highlight')

    // Should emit close event
    expect(wrapper.emitted('close')).toBeTruthy()

    // Should save completion to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('viz-matrix-tutorial-seen', 'true')
  })
})