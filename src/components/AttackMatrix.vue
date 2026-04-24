<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, onMounted } from 'vue'
import { tactics } from '../data/mitreData'
import { sourcetypes, type Sourcetype, type SourceCategory } from '../data/sourcetypes'
import MatrixCell from './MatrixCell.vue'
import TechniqueTooltip from './TechniqueTooltip.vue'
import SourcetypePanel from './SourcetypePanel.vue'
import AptPanel, { type AptGroup } from './AptPanel.vue'
import CoverageStats from './CoverageStats.vue'
import Recommendations from './Recommendations.vue'
import EnvironmentSetup from './EnvironmentSetup.vue'
import { exportToNavigator, importFromNavigator, downloadLayer, exportToXLSX, importFromXLSX, downloadXLSX, uploadFile, type NavigatorLayer } from '../utils/navigatorExport'
import HelpTutorial from './HelpTutorial.vue'

// Environment: defines what's relevant (attack surface)
// These are sourcetype IDs that COULD apply to the user's environment
const environmentSourceIds = ref<Set<string>>(new Set())

// Active sourcetypes: what the user is actually collecting/ingesting
const activeSourceIds = ref<Set<string>>(new Set())

const hoveredSourceId = ref<string | null>(null)
const activeOsEnvironments = ref<string[]>([])
const activeEnvCategories = ref<Set<string>>(new Set())
const crownJewelSourceIds = ref<Set<string>>(new Set())
const sourcetypePanelRef = ref<InstanceType<typeof SourcetypePanel> | null>(null)

// Crown jewel techniques: all techniques coverable by crown jewel environment sources
const crownJewelTechniqueIds = computed(() => {
  const ids = new Set<string>()
  for (const s of sourcetypes) {
    if (crownJewelSourceIds.value.has(s.id)) {
      for (const tid of s.techniqueIds) ids.add(tid)
    }
  }
  return ids
})

function onExpandCategories(categories: string[]) {
  for (const cat of categories) {
    sourcetypePanelRef.value?.expandCategory(cat as SourceCategory)
  }
}

function onEnvironmentChange(sourceIds: string[]) {
  environmentSourceIds.value = new Set(sourceIds)
}

const activeSources = computed(() =>
  sourcetypes.filter(s => activeSourceIds.value.has(s.id))
)

// Relevant sourcetypes: ones that match the user's environment
const relevantSourcetypes = computed(() =>
  sourcetypes.filter(s => environmentSourceIds.value.has(s.id))
)

// In-scope techniques: all techniques coverable by environment-relevant sourcetypes
const inScopeTechniqueIds = computed(() => {
  const ids = new Set<string>()
  for (const s of relevantSourcetypes.value) {
    for (const tid of s.techniqueIds) {
      ids.add(tid)
    }
  }
  return ids
})

function coverageCount(techniqueId: string): number {
  return activeSources.value.filter(s => s.techniqueIds.includes(techniqueId)).length
}

const sortedTactics = computed(() =>
  tactics.map(tactic => ({
    ...tactic,
    techniques: [...tactic.techniques].sort((a, b) => {
      // Check if techniques are affected by active APT groups
      const aIsApt = activeAptTechniques.value.has(a.id) ? 1 : 0
      const bIsApt = activeAptTechniques.value.has(b.id) ? 1 : 0

      // APT-affected techniques go to the top first
      if (aIsApt !== bIsApt) return bIsApt - aIsApt

      // Then sort by scope (in-scope first, N/A last)
      const aInScope = inScopeTechniqueIds.value.has(a.id) ? 1 : 0
      const bInScope = inScopeTechniqueIds.value.has(b.id) ? 1 : 0
      if (aInScope !== bInScope) return bInScope - aInScope

      // Within same APT status and scope: blind spots (0) first, then by coverage ascending
      const aCount = coverageCount(a.id)
      const bCount = coverageCount(b.id)
      return aCount - bCount
    }),
  }))
)

// Always show all techniques, but MatrixCell will handle showing/hiding technique IDs
const filteredTactics = computed(() => sortedTactics.value)

const tooltip = ref<{
  techniqueId: string
  techniqueName: string
  sources: Sourcetype[]
  x: number
  y: number
} | null>(null)

function toggleSource(id: string) {
  const next = new Set(activeSourceIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  activeSourceIds.value = next
}

function enableAll() {
  activeSourceIds.value = new Set(sourcetypes.map(s => s.id))
}

function disableAll() {
  activeSourceIds.value = new Set()
}

function enableCategory(cat: SourceCategory) {
  const next = new Set(activeSourceIds.value)
  for (const s of sourcetypes) {
    if (s.category === cat) next.add(s.id)
  }
  activeSourceIds.value = next
}

function disableCategory(cat: SourceCategory) {
  const next = new Set(activeSourceIds.value)
  for (const s of sourcetypes) {
    if (s.category === cat) next.delete(s.id)
  }
  activeSourceIds.value = next
}

function onCellHover(techniqueId: string, sources: Sourcetype[], event: MouseEvent) {
  const tech = tactics.flatMap(t => t.techniques).find(t => t.id === techniqueId)
  tooltip.value = {
    techniqueId,
    techniqueName: tech?.name ?? '',
    sources,
    x: event.clientX,
    y: event.clientY,
  }
}

function onCellLeave() {
  tooltip.value = null
}

const maxTechniques = computed(() =>
  Math.max(...tactics.map(t => t.techniques.length))
)

const sidebarOpen = ref(false)
const aptPanelOpen = ref(false)
const showHelpTutorial = ref(false)
const forceShowTutorial = ref(false)

// Desktop collapse states
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

// APT Groups state
const aptGroups = ref<AptGroup[]>([])
const activeAptIds = ref<Set<string>>(new Set())
const hoveredAptId = ref<string | null>(null)

// Computed relevant APT groups based on user's infrastructure
const relevantAptGroups = computed(() => {
  return aptGroups.value.map(group => {
    // Calculate how many of this group's techniques are relevant to user's infrastructure
    const relevantTechniques = new Map<string, { score: number; color: string; comment: string }>()

    for (const [techniqueId, info] of group.techniques) {
      // Check if this technique is covered by any sourcetype in user's environment
      const isRelevant = relevantSourcetypes.value.some(source =>
        source.techniqueIds.includes(techniqueId)
      )

      if (isRelevant) {
        relevantTechniques.set(techniqueId, info)
      }
    }

    return {
      ...group,
      relevantTechniqueCount: relevantTechniques.size,
      relevancyScore: relevantTechniques.size / group.techniqueCount,
      relevantTechniques
    }
  }).filter(group => group.relevancyScore > 0) // Only show groups with some relevance
})

// Computed APT techniques from active AND relevant groups
const activeAptTechniques = computed(() => {
  const techniques = new Map<string, { score: number; color: string; comment: string; aptGroup: string }>()

  for (const aptGroup of relevantAptGroups.value) {
    if (activeAptIds.value.has(aptGroup.id)) {
      for (const [techniqueId, info] of aptGroup.relevantTechniques) {
        // Only include techniques that are in scope for user's environment
        if (inScopeTechniqueIds.value.has(techniqueId)) {
          if (!techniques.has(techniqueId)) {
            techniques.set(techniqueId, { ...info, aptGroup: aptGroup.name })
          }
        }
      }
    }
  }

  return techniques
})

// Export/Import functions
async function exportCoverage() {
  try {
    // Show format selection dialog
    const choice = prompt(
      'Select export format:\n\n' +
      '• Type "json" for MITRE Navigator layer format\n' +
      '• Type "excel" for Excel spreadsheet format\n\n' +
      'Export as:',
      'json'
    )

    if (!choice) return // User cancelled

    const format = choice.toLowerCase().trim()
    if (format !== 'json' && format !== 'excel' && format !== 'xlsx') {
      alert('Please enter either "json" or "excel"')
      return
    }

    if (format === 'json') {
      const layer = exportToNavigator(
        activeSourceIds.value,
        'Viz-Matrix Coverage',
        `Coverage matrix exported from Viz-Matrix with ${activeSources.value.length} active sources`
      )
      downloadLayer(layer)
    } else {
      const xlsxData = exportToXLSX(activeSourceIds.value)
      downloadXLSX(xlsxData, `viz_matrix_coverage_${new Date().toISOString().split('T')[0]}.xlsx`)
    }
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export failed. Please try again.')
  }
}

async function importCoverage() {
  try {
    const fileData = await uploadFile()
    let result

    if (fileData.type === 'json') {
      result = importFromNavigator(fileData.content as NavigatorLayer)
    } else {
      result = importFromXLSX(fileData.content as ArrayBuffer)
    }

    // For APT layers: Add to APT groups list
    if (result.layerInfo.isAptLayer) {
      const aptId = `apt-${Date.now()}`
      const newAptGroup: AptGroup = {
        id: aptId,
        name: result.layerInfo.name || `Unnamed ${fileData.type.toUpperCase()} Import`,
        description: result.layerInfo.description || `Imported ${fileData.type.toUpperCase()} coverage data`,
        threatLevel: result.layerInfo.threatLevel,
        techniqueCount: result.layerInfo.coveredTechniques.length,
        techniques: result.layerInfo.aptTechniques,
        layerColors: result.layerInfo.layerColors
      }

      aptGroups.value.push(newAptGroup)
      // Don't automatically activate the APT group

      alert(`${fileData.type.toUpperCase()} Coverage Imported as APT Layer: "${result.layerInfo.name}"\n` +
            `Threat Level: ${result.layerInfo.threatLevel.toUpperCase()}\n` +
            `${result.layerInfo.coveredTechniques.length} techniques identified\n\n` +
            `Added to APT panel (not active). Enable it in the APT panel to overlay on the matrix, then select your actual sourcetypes to see coverage gaps.`)
    } else {
      // For normal layers: enable matching sourcetypes
      activeSourceIds.value = result.activeSourceIds

      alert(`Successfully imported ${fileData.type.toUpperCase()} coverage data\n` +
            `Loaded ${result.activeSourceIds.size} sourcetypes covering ${result.layerInfo.coveredTechniques.length} techniques`)
    }
  } catch (error) {
    console.error('Import failed:', error)
    alert('Import failed: ' + (error as Error).message)
  }
}

// APT Management Functions
function toggleApt(id: string) {
  const next = new Set(activeAptIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  activeAptIds.value = next
}

function enableAllApts() {
  activeAptIds.value = new Set(relevantAptGroups.value.map(apt => apt.id))
}

function disableAllApts() {
  activeAptIds.value = new Set()
}

// Total loaded APT groups (including non-relevant ones)
const totalAptGroups = computed(() => aptGroups.value.length)

function renameApt(id: string, newName: string) {
  const apt = aptGroups.value.find(a => a.id === id)
  if (apt) {
    apt.name = newName
  }
}

function deleteApt(id: string) {
  if (confirm('Delete this APT group?')) {
    aptGroups.value = aptGroups.value.filter(a => a.id !== id)
    activeAptIds.value.delete(id)
  }
}

// Desktop sidebar collapse functions
function toggleLeftSidebar() {
  leftSidebarCollapsed.value = !leftSidebarCollapsed.value
}

function toggleRightSidebar() {
  rightSidebarCollapsed.value = !rightSidebarCollapsed.value
}

// Help tutorial function
function showHelp() {
  forceShowTutorial.value = true
  showHelpTutorial.value = true
}

function closeHelp() {
  showHelpTutorial.value = false
  forceShowTutorial.value = false
}

// Check for first-time users on mount
onMounted(() => {
  const hasSeenTutorial = localStorage.getItem('viz-matrix-tutorial-seen')
  if (!hasSeenTutorial) {
    showHelpTutorial.value = true
  }
})
</script>

<template>
  <div class="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">
    <!-- Mobile toggles -->
    <button
      class="fixed top-3 left-3 z-50 lg:hidden w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
      @click="sidebarOpen = !sidebarOpen"
    >
      <i :class="sidebarOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
    </button>

    <button
      class="fixed top-3 right-3 z-50 lg:hidden w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
      @click="aptPanelOpen = !aptPanelOpen"
    >
      <i :class="aptPanelOpen ? 'fas fa-times' : 'fas fa-user-secret'"></i>
    </button>

    <!-- Sidebar backdrops (mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />
    <div
      v-if="aptPanelOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="aptPanelOpen = false"
    />

    <!-- Left Sidebar - Sourcetypes -->
    <aside
      class="sourcetype-panel shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 overflow-hidden flex flex-col z-40 fixed inset-y-0 left-0 sidebar-transition lg:relative lg:translate-x-0"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        leftSidebarCollapsed ? 'lg:w-0 lg:p-0 lg:border-r-0' : 'lg:w-64'
      ]"
      :style="{ width: leftSidebarCollapsed ? '0px' : '256px' }"
    >
      <SourcetypePanel
        v-show="!leftSidebarCollapsed"
        ref="sourcetypePanelRef"
        :sourcetypes="sourcetypes"
        :active-ids="activeSourceIds"
        @toggle="toggleSource"
        @enable-all="enableAll"
        @disable-all="disableAll"
        @enable-category="enableCategory"
        @disable-category="disableCategory"
        @hover-source="(id: string) => hoveredSourceId = id"
        @leave-source="hoveredSourceId = null"
      />
      <!-- Mobile recommendations -->
      <div v-if="inScopeTechniqueIds.size > 0" class="lg:hidden border-t border-zinc-800 mt-3 pt-3 shrink-0">
        <Recommendations
          :active-sources="activeSources"
          :in-scope-ids="inScopeTechniqueIds"
          :active-env-categories="activeEnvCategories"
          :crown-jewel-ids="crownJewelTechniqueIds"
          @enable="toggleSource"
          @hover-source="(id: string) => hoveredSourceId = id"
          @leave-source="hoveredSourceId = null"
        />
      </div>
    </aside>

    <!-- Left Sidebar Collapse Handle -->
    <div
      class="hidden lg:flex fixed left-0 top-1/2 z-50 -translate-y-1/2 sidebar-transition"
      :class="leftSidebarCollapsed ? 'translate-x-0' : 'translate-x-64'"
    >
      <button
        @click="toggleLeftSidebar"
        class="sidebar-handle border border-zinc-700 border-l-0 rounded-r-lg p-2 text-zinc-400 hover:text-zinc-200 transition-all duration-200 group"
        title="Toggle left sidebar"
      >
        <i
          class="fas fa-chevron-left text-xs transition-transform duration-200"
          :class="leftSidebarCollapsed ? 'rotate-180' : ''"
        ></i>
      </button>
    </div>

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="shrink-0 border-b border-zinc-800 px-3 lg:px-6 py-3">
        <!-- Desktop: row layout / Mobile: stacked -->
        <div class="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
          <div class="shrink-0 flex items-center gap-3">
            <!-- Spacer for hamburger on mobile -->
            <div class="w-8 lg:hidden" />
            <h1 class="text-lg font-semibold tracking-tight">
              <span class="text-zinc-500">Viz-</span><span class="text-zinc-100">Matrix</span>
            </h1>
            <!-- Export/Import buttons -->
            <div class="import-export-buttons flex items-center gap-1.5 ml-2">
              <button
                @click="exportCoverage"
                class="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                title="Export coverage (JSON or Excel)"
              >
                <i class="fas fa-download mr-1"></i>Export
              </button>
              <button
                @click="importCoverage"
                class="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                title="Import coverage (JSON or Excel)"
              >
                <i class="fas fa-upload mr-1"></i>Import
              </button>
              <button
                @click="showHelp"
                class="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded transition-colors"
                title="Show help tutorial"
              >
                <i class="fas fa-question-circle"></i>
              </button>
            </div>
          </div>
          <div class="flex-1 flex flex-col items-center gap-1">
            <CoverageStats :active-sources="activeSources" :in-scope-ids="inScopeTechniqueIds" />
            <!-- APT Active Indicator -->
            <div v-if="activeAptIds.size > 0" class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-800/50">
              <i class="fas fa-exclamation-triangle text-xs"></i>
              <span>{{ activeAptIds.size }} APT Group{{ activeAptIds.size === 1 ? '' : 's' }} Active</span>
              <button @click="disableAllApts" class="ml-1 hover:bg-black/20 rounded px-1" title="Clear All APTs">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="shrink-0 flex items-center justify-center lg:justify-end gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500" />
              <span class="text-zinc-400">Covered</span>
              <span class="font-mono font-semibold text-zinc-200">{{ activeSources.reduce((ids, s) => { s.techniqueIds.forEach(t => { if (inScopeTechniqueIds.has(t)) ids.add(t) }); return ids }, new Set<string>()).size }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500" />
              <span class="text-zinc-400">Blind Spots</span>
              <span class="font-mono font-semibold text-zinc-200">{{ inScopeTechniqueIds.size - activeSources.reduce((ids, s) => { s.techniqueIds.forEach(t => { if (inScopeTechniqueIds.has(t)) ids.add(t) }); return ids }, new Set<string>()).size }}</span>
            </div>
          </div>
        </div>
        <div class="border-t border-zinc-800/60 pt-2">
          <EnvironmentSetup
            @apply="onEnvironmentChange"
            @expand-categories="onExpandCategories"
            @active-categories="(cats: string[]) => { activeEnvCategories = new Set(cats); activeOsEnvironments = cats.filter(c => ['windows','linux','macos'].includes(c)) }"
            @crown-jewel-techniques="(ids: Set<string>) => crownJewelSourceIds = ids"
          />
        </div>
        <div v-if="inScopeTechniqueIds.size > 0" class="hidden lg:block border-t border-zinc-800/60 mt-2 pt-2">
          <Recommendations
            :active-sources="activeSources"
            :in-scope-ids="inScopeTechniqueIds"
            :active-env-categories="activeEnvCategories"
            :crown-jewel-ids="crownJewelTechniqueIds"
            @enable="toggleSource"
            @hover-source="(id: string) => hoveredSourceId = id"
            @leave-source="hoveredSourceId = null"
          />
        </div>
      </header>

      <!-- Matrix grid -->
      <div class="matrix-area flex-1 overflow-auto p-1 lg:p-4">
        <div
          class="grid gap-px min-w-fit"
          :style="{
            gridTemplateColumns: `repeat(${tactics.length}, minmax(45px, 1fr))`,
          }"
        >
          <!-- Tactic headers -->
          <div
            v-for="tactic in filteredTactics"
            :key="tactic.id"
            class="px-0.5 lg:px-1 py-1 lg:py-2 text-center border-b border-zinc-800"
          >
            <div class="hidden lg:block text-[10px] font-mono text-zinc-600 mb-0.5">{{ tactic.id }}</div>
            <div class="text-[8px] lg:text-[11px] font-semibold text-zinc-300 leading-tight">{{ tactic.shortName }}</div>
          </div>

          <!-- Technique columns -->
          <div
            v-for="tactic in filteredTactics"
            :key="'col-' + tactic.id"
            class="flex flex-col gap-px p-0.5"
          >
            <div
              v-for="tech in tactic.techniques"
              :key="tech.id"
              @mouseenter="(e: MouseEvent) => onCellHover(tech.id, activeSources.filter(s => s.techniqueIds.includes(tech.id)), e)"
              @mouseleave="onCellLeave"
            >
              <MatrixCell
                :technique-id="tech.id"
                :technique-name="tech.name"
                :active-sources="activeSources"
                :in-scope="inScopeTechniqueIds.has(tech.id)"
                :highlighted-source-id="hoveredSourceId"
                :active-os="activeOsEnvironments"
                :is-crown-jewel="crownJewelTechniqueIds.has(tech.id)"
                :apt-info="activeAptTechniques.get(tech.id)"
                @hover="() => {}"
                @leave="() => {}"
              />
            </div>
            <!-- Spacer cells to align columns -->
            <div
              v-for="n in maxTechniques - tactic.techniques.length"
              :key="'spacer-' + n"
              class="w-full h-[14px] lg:h-[28px]"
            />
          </div>
        </div>
      </div>

      <!-- Legend bar -->
      <footer class="hidden lg:flex shrink-0 border-t border-zinc-800 px-6 py-2 items-center justify-between">
        <div class="flex items-center gap-4 text-[10px] text-zinc-500">
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style="background: rgba(220, 50, 40, 0.85)" />
            <span>Blind Spot</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style="background: rgba(210, 180, 40, 0.85)" />
            <span>Covered</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style="background: rgba(30, 200, 80, 0.9)" />
            <span>Defense in Depth</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style="background: rgba(39, 39, 42, 0.2)" />
            <span>N/A</span>
          </div>
        </div>
        <div class="text-[10px] text-zinc-600 font-mono">
          {{ activeSources.length }} sourcetypes active
        </div>
      </footer>
    </main>

    <!-- Right Sidebar - APT Groups -->
    <aside
      class="apt-panel shrink-0 border-l border-zinc-800 bg-zinc-950 p-4 overflow-hidden flex flex-col z-40 fixed inset-y-0 right-0 sidebar-transition lg:relative lg:translate-x-0"
      :class="[
        aptPanelOpen ? 'translate-x-0' : 'translate-x-full',
        rightSidebarCollapsed ? 'lg:w-0 lg:p-0 lg:border-l-0' : 'lg:w-64'
      ]"
      :style="{ width: rightSidebarCollapsed ? '0px' : '256px' }"
    >
      <AptPanel
        v-show="!rightSidebarCollapsed"
        :apt-groups="relevantAptGroups"
        :active-ids="activeAptIds"
        :total-groups="totalAptGroups"
        @toggle="toggleApt"
        @enable-all="enableAllApts"
        @disable-all="disableAllApts"
        @hover-apt="(id: string) => hoveredAptId = id"
        @leave-apt="hoveredAptId = null"
        @rename-apt="renameApt"
        @delete-apt="deleteApt"
      />
    </aside>

    <!-- Right Sidebar Collapse Handle -->
    <div
      class="hidden lg:flex fixed right-0 top-1/2 z-50 -translate-y-1/2 sidebar-transition"
      :class="rightSidebarCollapsed ? 'translate-x-0' : '-translate-x-64'"
    >
      <button
        @click="toggleRightSidebar"
        class="sidebar-handle border border-zinc-700 border-r-0 rounded-l-lg p-2 text-zinc-400 hover:text-zinc-200 transition-all duration-200 group"
        title="Toggle right sidebar"
      >
        <i
          class="fas fa-chevron-right text-xs transition-transform duration-200"
          :class="rightSidebarCollapsed ? 'rotate-180' : ''"
        ></i>
      </button>
    </div>

    <!-- Tooltip -->
    <TechniqueTooltip
      v-if="tooltip"
      :technique-id="tooltip.techniqueId"
      :technique-name="tooltip.techniqueName"
      :sources="tooltip.sources"
      :total-active="activeSources.length"
      :in-scope="inScopeTechniqueIds.has(tooltip.techniqueId)"
      :x="tooltip.x"
      :y="tooltip.y"
    />

    <!-- Help Tutorial -->
    <HelpTutorial
      v-if="showHelpTutorial"
      :force-show="forceShowTutorial"
      @close="closeHelp"
    />
  </div>
</template>
