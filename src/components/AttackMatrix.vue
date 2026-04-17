<script setup lang="ts">
import { ref, computed } from 'vue'
import { tactics } from '../data/mitreData'
import { sourcetypes, type Sourcetype, type SourceCategory } from '../data/sourcetypes'
import MatrixCell from './MatrixCell.vue'
import TechniqueTooltip from './TechniqueTooltip.vue'
import SourcetypePanel from './SourcetypePanel.vue'
import CoverageStats from './CoverageStats.vue'
import Recommendations from './Recommendations.vue'
import EnvironmentSetup from './EnvironmentSetup.vue'

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
      const aInScope = inScopeTechniqueIds.value.has(a.id) ? 1 : 0
      const bInScope = inScopeTechniqueIds.value.has(b.id) ? 1 : 0
      // In-scope first, N/A last
      if (aInScope !== bInScope) return bInScope - aInScope
      // Within in-scope: blind spots (0) first, then by coverage ascending
      const aCount = coverageCount(a.id)
      const bCount = coverageCount(b.id)
      return aCount - bCount
    }),
  }))
)

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
</script>

<template>
  <div class="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">
    <!-- Mobile sidebar toggle -->
    <button
      class="fixed top-3 left-3 z-50 lg:hidden w-8 h-8 flex items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
      @click="sidebarOpen = !sidebarOpen"
    >
      <span class="text-sm">{{ sidebarOpen ? '&times;' : '&#9776;' }}</span>
    </button>

    <!-- Sidebar backdrop (mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 overflow-hidden flex flex-col z-40 fixed inset-y-0 left-0 transition-transform duration-200 lg:relative lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <SourcetypePanel
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
          </div>
          <div class="flex-1 flex justify-center">
            <CoverageStats :active-sources="activeSources" :in-scope-ids="inScopeTechniqueIds" />
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
      <div class="flex-1 overflow-auto p-1 lg:p-4">
        <div
          class="grid gap-px min-w-fit"
          :style="{
            gridTemplateColumns: `repeat(${tactics.length}, minmax(45px, 1fr))`,
          }"
        >
          <!-- Tactic headers -->
          <div
            v-for="tactic in sortedTactics"
            :key="tactic.id"
            class="px-0.5 lg:px-1 py-1 lg:py-2 text-center border-b border-zinc-800"
          >
            <div class="hidden lg:block text-[10px] font-mono text-zinc-600 mb-0.5">{{ tactic.id }}</div>
            <div class="text-[8px] lg:text-[11px] font-semibold text-zinc-300 leading-tight">{{ tactic.shortName }}</div>
          </div>

          <!-- Technique columns -->
          <div
            v-for="tactic in sortedTactics"
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
  </div>
</template>
