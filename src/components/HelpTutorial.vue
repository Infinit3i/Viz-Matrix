<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  forceShow?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const currentStep = ref(0)
const showTutorial = ref(false)

const steps = [
  {
    title: 'Welcome to Viz-Matrix',
    description: 'Would you like a quick tour to learn how to use the MITRE ATT&CK visibility matrix?',
    target: null,
    position: 'center'
  },
  {
    title: 'Attack Matrix (Center)',
    description: 'This matrix represents YOUR attack surface - what you own and operate. Each cell is a MITRE ATT&CK technique that could target your infrastructure.',
    target: '.matrix-area',
    position: 'top'
  },
  {
    title: 'Detection Capabilities (Left)',
    description: 'Select what you can SEE - your security tools and data sources. These are your defensive detection capabilities.',
    target: '.sourcetype-panel',
    position: 'right'
  },
  {
    title: 'Threat Intelligence (Right)',
    description: 'See what ATTACKS you - APT groups and threat actors that target your type of infrastructure. Only relevant threats appear.',
    target: '.apt-panel',
    position: 'left'
  },
  {
    title: 'Import & Export',
    description: 'Import MITRE Navigator layers and export your coverage analysis. Share configurations with your team.',
    target: '.import-export-buttons',
    position: 'bottom'
  }
]

const currentStepData = computed(() => steps[currentStep.value])

function startTutorial() {
  showTutorial.value = true
  currentStep.value = 1 // Skip the intro step
  nextTick(() => {
    highlightTarget()
  })
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
    nextTick(() => {
      highlightTarget()
    })
  } else {
    closeTutorial()
  }
}

function skipTutorial() {
  cleanupHighlights()
  localStorage.setItem('viz-matrix-tutorial-seen', 'true')
  closeTutorial()
}

function closeTutorial() {
  cleanupHighlights()
  showTutorial.value = false
  localStorage.setItem('viz-matrix-tutorial-seen', 'true')
  emit('close')
}

function cleanupHighlights() {
  // Remove all tutorial highlights when closing
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight')
  })
}

function highlightTarget() {
  const target = currentStepData.value.target
  if (!target) return

  // Remove existing highlights
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight')
  })

  // Add highlight to target
  const element = document.querySelector(target)
  if (element) {
    element.classList.add('tutorial-highlight')
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

onMounted(() => {
  // Check if user has seen tutorial before or if forced to show
  const hasSeenTutorial = localStorage.getItem('viz-matrix-tutorial-seen')
  if (!hasSeenTutorial || props.forceShow) {
    showTutorial.value = true
  }
})

onUnmounted(() => {
  // Clean up any remaining highlights when component is destroyed
  cleanupHighlights()
})
</script>

<template>
  <div v-if="showTutorial" class="fixed inset-0 z-50">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/20"></div>

    <!-- Tutorial Modal -->
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl max-w-md w-full">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-zinc-800">
          <div class="flex items-center gap-2">
            <i class="fas fa-question-circle text-blue-400"></i>
            <h3 class="text-sm font-semibold text-zinc-200">{{ currentStepData.title }}</h3>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-500 font-mono">{{ currentStep + 1 }}/{{ steps.length }}</span>
            <button @click="closeTutorial" class="text-zinc-500 hover:text-zinc-300">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <p class="text-sm text-zinc-300 leading-relaxed">{{ currentStepData.description }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between p-4 border-t border-zinc-800">
          <button
            @click="skipTutorial"
            class="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Skip tutorial
          </button>

          <div class="flex gap-2">
            <button
              v-if="currentStep === 0"
              @click="skipTutorial"
              class="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
            >
              No thanks
            </button>
            <button
              v-if="currentStep === 0"
              @click="startTutorial"
              class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <i class="fas fa-play mr-1"></i>Start tour
            </button>

            <button
              v-if="currentStep > 0"
              @click="nextStep"
              class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              {{ currentStep === steps.length - 1 ? 'Finish' : 'Next' }}
              <i v-if="currentStep < steps.length - 1" class="fas fa-arrow-right ml-1"></i>
              <i v-else class="fas fa-check ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(.tutorial-highlight) {
  position: relative;
  z-index: 45;
  outline: 4px solid #3b82f6;
  outline-offset: 3px;
  border-radius: 6px;
  box-shadow:
    0 0 30px rgba(59, 130, 246, 0.8),
    0 0 60px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  background-color: rgba(0, 0, 0, 0.05);
}

:global(.tutorial-highlight::before) {
  content: '';
  position: absolute;
  inset: -8px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 10px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}
</style>